import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, FileMinus, FilePlus, Package, Clock, Eye, EyeOff, Globe, GlobeLock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface LaundryItemProps {
  partner: any;
  onEdit: (partner: any) => void;
  onManageItems: (partner: any) => void;
  onManageSlots: (partner: any) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  onToggleBooking?: (id: string, isBookingActive: boolean) => void;
  onTogglePartnerVisible?: (id: string, isVisible: boolean) => void;
  onToggleStudentVisible?: (id: string, isVisible: boolean) => void;
  itemCount?: number;
  slotCount?: number;
}

export function LaundryItem({
  partner, onEdit, onManageItems, onManageSlots,
  onToggleActive, onToggleBooking, onTogglePartnerVisible, onToggleStudentVisible,
  itemCount = 0, slotCount = 0,
}: LaundryItemProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const opHours = partner.operating_hours;
  const opLabel = opHours?.start && opHours?.end ? `${opHours.start} – ${opHours.end}` : '—';

  return (
    <Card className="group h-full flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md rounded-xl border border-border/60">
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Header bar */}
        <div className="px-3 pt-3 pb-2 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {partner.serial_number && (
              <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs font-mono">
                #{partner.serial_number}
              </span>
            )}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${partner.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {partner.is_active ? '● Active' : '● Inactive'}
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${partner.status === 'active' || partner.status === 'approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {partner.status === 'active' || partner.status === 'approved' ? '✓ Approved' : '⏳ Pending'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${!partner.is_booking_active ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {!partner.is_booking_active ? '● Online Off' : '● Online On'}
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${partner.is_partner_visible === false ? 'bg-muted text-muted-foreground border border-border' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              {partner.is_partner_visible === false ? '● Emp Hidden' : '● Emp Visible'}
            </span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${partner.is_student_visible === false ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
              {partner.is_student_visible === false ? '● Student Hidden' : '● Student Visible'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col gap-1.5">
          <h3 className="font-semibold text-sm leading-snug text-foreground">{partner.business_name}</h3>
          {partner.contact_person && (
            <p className="text-xs text-muted-foreground">👤 {partner.contact_person} · 📞 {partner.phone || '—'}</p>
          )}
          {partner.service_area && (
            <p className="text-xs text-muted-foreground">📍 {partner.service_area}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{opLabel}</span>
            <span>🚚 {partner.delivery_time_hours || 48}h</span>
          </div>
          {partner.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{partner.description}</p>
          )}
          {partner.commission_percentage > 0 && (
            <span className="text-[10px] text-muted-foreground">Commission: {partner.commission_percentage}%</span>
          )}

          {/* Actions */}
          <TooltipProvider delayDuration={300}>
            <div className="border-t pt-2 mt-1">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onEdit(partner)}>
                  <Edit className="h-3 w-3 mr-1" />Edit
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onManageItems(partner)}>
                      <Package className="h-3 w-3 mr-1" />Items
                      {itemCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{itemCount}</Badge>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Manage laundry items</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onManageSlots(partner)}>
                      <Clock className="h-3 w-3 mr-1" />Slots
                      {slotCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{slotCount}</Badge>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Manage pickup slots</TooltipContent>
                </Tooltip>
                {onToggleActive && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" variant="outline"
                        className={`h-7 w-7 ${partner.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                        onClick={() => onToggleActive(partner.id, !partner.is_active)}
                      >
                        {partner.is_active ? <FileMinus className="h-3.5 w-3.5" /> : <FilePlus className="h-3.5 w-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{partner.is_active ? 'Deactivate' : 'Activate'}</TooltipContent>
                  </Tooltip>
                )}
                {onToggleBooking && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" variant="outline" disabled={!partner.is_active}
                        className={`h-7 w-7 ${!partner.is_booking_active ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}`}
                        onClick={() => onToggleBooking(partner.id, !partner.is_booking_active)}
                      >
                        {!partner.is_booking_active ? <Globe className="h-3.5 w-3.5" /> : <GlobeLock className="h-3.5 w-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{!partner.is_booking_active ? 'Turn Online On' : 'Turn Online Off'}</TooltipContent>
                  </Tooltip>
                )}
                {onTogglePartnerVisible && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" variant="outline" disabled={!partner.is_active}
                        className={`h-7 w-7 ${partner.is_partner_visible === false ? 'text-blue-600 border-blue-200 hover:bg-blue-50' : 'text-muted-foreground border-border hover:bg-muted'}`}
                        onClick={() => onTogglePartnerVisible(partner.id, !(partner.is_partner_visible !== false))}
                      >
                        {partner.is_partner_visible === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{partner.is_partner_visible === false ? 'Show to Employees' : 'Hide from Employees'}</TooltipContent>
                  </Tooltip>
                )}
                {onToggleStudentVisible && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon" variant="outline" disabled={!partner.is_active}
                        className={`h-7 w-7 ${partner.is_student_visible === false ? 'text-teal-600 border-teal-200 hover:bg-teal-50' : 'text-orange-600 border-orange-200 hover:bg-orange-50'}`}
                        onClick={() => onToggleStudentVisible(partner.id, !(partner.is_student_visible !== false))}
                      >
                        {partner.is_student_visible === false ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{partner.is_student_visible === false ? 'Show to Students' : 'Hide from Students'}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
