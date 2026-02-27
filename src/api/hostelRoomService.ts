
import { supabase } from '@/integrations/supabase/client';

export interface HostelRoomData {
  id?: string;
  hostel_id: string;
  room_number: string;
  floor: number;
  category: 'standard' | 'premium' | 'luxury';
  description?: string;
  image_url?: string;
  images?: string[];
  amenities?: string[];
  is_active?: boolean;
}

export interface SharingOptionData {
  id?: string;
  room_id?: string;
  type: string;
  capacity: number;
  total_beds: number;
  price_daily: number;
  price_monthly: number;
  is_active?: boolean;
}

export const hostelRoomService = {
  getHostelRooms: async (hostelId: string) => {
    const { data, error } = await supabase
      .from('hostel_rooms')
      .select('*, hostel_sharing_options(*, hostel_beds(*))')
      .eq('hostel_id', hostelId)
      .eq('is_active', true)
      .order('floor', { ascending: true });
    if (error) throw error;
    return data;
  },

  getRoom: async (roomId: string) => {
    const { data, error } = await supabase
      .from('hostel_rooms')
      .select('*, hostel_sharing_options(*, hostel_beds(*))')
      .eq('id', roomId)
      .single();
    if (error) throw error;
    return data;
  },

  createRoom: async (hostelId: string, roomData: Omit<HostelRoomData, 'hostel_id'>, sharingOptions?: SharingOptionData[]) => {
    // Insert the room
    const { data: room, error: roomError } = await supabase
      .from('hostel_rooms')
      .insert({ ...roomData, hostel_id: hostelId })
      .select()
      .single();
    if (roomError) throw roomError;

    // Insert sharing options and beds
    if (sharingOptions && sharingOptions.length > 0) {
      for (const option of sharingOptions) {
        const { data: sharingOption, error: soError } = await supabase
          .from('hostel_sharing_options')
          .insert({
            room_id: room.id,
            type: option.type,
            capacity: option.capacity,
            total_beds: option.total_beds,
            price_daily: option.price_daily,
            price_monthly: option.price_monthly,
          })
          .select()
          .single();
        if (soError) throw soError;

        // Create beds for this sharing option
        const beds = Array.from({ length: option.total_beds }, (_, i) => ({
          room_id: room.id,
          sharing_option_id: sharingOption.id,
          bed_number: i + 1,
          is_available: true,
        }));

        const { error: bedError } = await supabase
          .from('hostel_beds')
          .insert(beds);
        if (bedError) throw bedError;
      }
    }

    return room;
  },

  updateRoom: async (roomId: string, roomData: Partial<HostelRoomData>) => {
    const { data, error } = await supabase
      .from('hostel_rooms')
      .update(roomData)
      .eq('id', roomId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteRoom: async (roomId: string) => {
    const { error } = await supabase
      .from('hostel_rooms')
      .delete()
      .eq('id', roomId);
    if (error) throw error;
  },

  getRoomStats: async (hostelId: string) => {
    const { data: rooms, error } = await supabase
      .from('hostel_rooms')
      .select('id, category, hostel_sharing_options(total_beds, hostel_beds(is_available))')
      .eq('hostel_id', hostelId)
      .eq('is_active', true);
    if (error) throw error;

    const totalRooms = rooms?.length || 0;
    let totalBeds = 0;
    let availableBeds = 0;
    const roomsByType: Record<string, number> = {};

    rooms?.forEach((room: any) => {
      const category = room.category || 'standard';
      roomsByType[category] = (roomsByType[category] || 0) + 1;

      room.hostel_sharing_options?.forEach((opt: any) => {
        totalBeds += opt.total_beds || 0;
        availableBeds += opt.hostel_beds?.filter((b: any) => b.is_available).length || 0;
      });
    });

    return {
      totalRooms,
      totalBeds,
      availableBeds,
      occupiedBeds: totalBeds - availableBeds,
      occupancyPercentage: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
      roomsByType,
    };
  },

  // Sharing option management
  addSharingOption: async (roomId: string, option: SharingOptionData) => {
    const { data: sharingOption, error } = await supabase
      .from('hostel_sharing_options')
      .insert({ ...option, room_id: roomId })
      .select()
      .single();
    if (error) throw error;

    // Create beds
    const beds = Array.from({ length: option.total_beds }, (_, i) => ({
      room_id: roomId,
      sharing_option_id: sharingOption.id,
      bed_number: i + 1,
    }));
    await supabase.from('hostel_beds').insert(beds);

    return sharingOption;
  },

  updateSharingOption: async (optionId: string, data: Partial<SharingOptionData>) => {
    const { data: result, error } = await supabase
      .from('hostel_sharing_options')
      .update(data)
      .eq('id', optionId)
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  deleteSharingOption: async (optionId: string) => {
    const { error } = await supabase
      .from('hostel_sharing_options')
      .delete()
      .eq('id', optionId);
    if (error) throw error;
  },

  // Upload room images
  uploadRoomImages: async (roomId: string, files: File[]) => {
    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const filePath = `rooms/${roomId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('hostel-images')
        .upload(filePath, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('hostel-images')
        .getPublicUrl(filePath);
      urls.push(publicUrl);
    }
    return urls;
  },
};
