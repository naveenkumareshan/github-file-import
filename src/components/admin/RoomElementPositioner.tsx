
import React, { useState, useEffect } from 'react';
import { 
  DoorOpen, 
  ToiletIcon, 
  Wind, 
  MonitorPlay,
  Save,
  RotateCw,
  Trash2,
  AirVentIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface RoomElement {
  id: string;
  type: 'door' | 'bath' | 'window' | 'screen' | 'AC';
  position: { x: number; y: number };
  rotation?: number; // Added rotation property (degrees: 0, 90, 180, 270)
}

interface RoomElementPositionerProps {
  roomId: string;
  initialElements?: RoomElement[];
  onSave: (elements: RoomElement[]) => void;
  readOnly?: boolean;
}

export const RoomElementPositioner: React.FC<RoomElementPositionerProps> = ({
  roomId,
  initialElements = [],
  onSave,
  readOnly = false
}) => {
  // Initialize elements with rotation property if not present
  const initialElementsWithRotation = initialElements.map(element => ({
    ...element,
    rotation: element.rotation || 0
  }));
  
  const [elements, setElements] = useState<RoomElement[]>(initialElementsWithRotation);
  const [draggingElement, setDraggingElement] = useState<RoomElement | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDirty, setIsDirty] = useState(false);
  const [selectedToolbarItem, setSelectedToolbarItem] = useState<'door' | 'bath' | 'window' | 'screen' | 'AC' | null>(null);
  
  // Map element types to their icons
  const elementIcons = {
    door: DoorOpen,
    bath: ToiletIcon,
    window: Wind,
    screen: MonitorPlay,
    AC: AirVentIcon
  };
  
  const handleAddElement = (type: 'door' | 'bath' | 'window' | 'screen' | 'AC') => {
    if (readOnly) return;
    
    // Create a new element with rotation property
    const newElement: RoomElement = {
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 50, y: 50 },
      rotation: 0 // Default rotation
    };
    
    setElements([...elements, newElement]);
    setIsDirty(true);
    setSelectedToolbarItem(type);
  };
  
  const handleElementMouseDown = (e: React.MouseEvent, element: RoomElement) => {
    if (readOnly) return;
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingElement(element);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingElement || readOnly) return;
    
    const mapRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - mapRect.left - dragOffset.x;
    const y = e.clientY - mapRect.top - dragOffset.y;
    
    // Ensure element stays within the boundaries
    const clampedX = Math.max(0, Math.min(x, mapRect.width - 40));
    const clampedY = Math.max(0, Math.min(y, mapRect.height - 40));
    
    // Update element position
    const updatedElements = elements.map(el => {
      if (el.id === draggingElement.id) {
        return {
          ...el,
          position: {
            x: Math.round(clampedX / 20) * 20,
            y: Math.round(clampedY / 20) * 20
          }
        };
      }
      return el;
    });
    
    setElements(updatedElements);
    setIsDirty(true);
  };
  
  const handleMouseUp = () => {
    setDraggingElement(null);
  };
  
  const handleRemoveElement = (elementId: string) => {
    if (readOnly) return;
    setElements(elements.filter(el => el.id !== elementId));
    setIsDirty(true);
  };
  
  const handleSaveElements = () => {
    onSave(elements);
    setIsDirty(false);
  };
  
  // New function to handle element rotation
  const handleRotateElement = (elementId: string) => {
    if (readOnly) return;
    
    const updatedElements = elements.map(el => {
      if (el.id === elementId) {
        // Rotate by 90 degrees (0 -> 90 -> 180 -> 270 -> 0)
        const newRotation = ((el.rotation || 0) + 90) % 360;
        return {
          ...el,
          rotation: newRotation
        };
      }
      return el;
    });
    
    setElements(updatedElements);
    setIsDirty(true);
  };
  
  React.useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  return (
    <div className="room-element-positioner">
      {!readOnly && (
        <div className="flex flex-wrap justify-between mb-4 gap-2">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className={selectedToolbarItem === 'door' ? 'bg-primary text-white' : ''}
              onClick={() => handleAddElement('door')}
            >
              <DoorOpen className="h-4 w-4 mr-2" />
              Door
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={selectedToolbarItem === 'bath' ? 'bg-primary text-white' : ''}
              onClick={() => handleAddElement('bath')}
            >
              <ToiletIcon className="h-4 w-4 mr-2" />
              Bath
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={selectedToolbarItem === 'window' ? 'bg-primary text-white' : ''}
              onClick={() => handleAddElement('window')}
            >
              <Wind className="h-4 w-4 mr-2" />
              Window
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={selectedToolbarItem === 'screen' ? 'bg-primary text-white' : ''}
              onClick={() => handleAddElement('screen')}
            >
              <MonitorPlay className="h-4 w-4 mr-2" />
              Screen
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={selectedToolbarItem === 'AC' ? 'bg-primary text-white' : ''}
              onClick={() => handleAddElement('AC')}
            >
              <AirVentIcon className="h-4 w-4 mr-2" />
              Ac
            </Button>
          </div>
          
          <Button 
            onClick={handleSaveElements} 
            disabled={!isDirty}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Layout
          </Button>
        </div>
      )}
      
      <ScrollArea className="h-[600px] border rounded-md">
        <div 
          className="relative bg-[#f6f8fa] rounded-lg p-8"
          style={{ minHeight: "600px", minWidth: "600px" }}
          onMouseMove={handleMouseMove}
        >
          {elements.map((element) => {
            const ElementIcon = elementIcons[element.type];
            return (
              <div
                key={element.id}
                className={`absolute flex flex-col items-center justify-center p-2 rounded ${
                  draggingElement?.id === element.id ? 'z-10' : 'z-1'
                } ${readOnly ? 'cursor-default' : 'cursor-grab'}`}
                style={{
                  left: element.position.x,
                  top: element.position.y,
                  background: 'white', 
                  border: '1px solid #ddd',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element)}
              >
                <div className="flex items-center mb-1">
                  <ElementIcon 
                    className="h-5 w-5" 
                    data-type={element.type}
                    style={{ 
                      transform: `rotate(${element.rotation || 0}deg)`,
                      transition: 'transform 0.2s ease'
                    }}
                  />
                  <span className="text-xs ml-1">{element.type}</span>
                </div>
                
                {!readOnly && (
                  <div className="flex gap-1 mt-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 p-0" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRotateElement(element.id);
                            }}
                          >
                            <RotateCw className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Rotate</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 p-0 text-red-500" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveElement(element.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Remove</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="mt-2 text-xs text-muted-foreground">
        {!readOnly && "Click and drag to reposition elements. Use the rotate button to change orientation."}
      </div>
    </div>
  );
};
