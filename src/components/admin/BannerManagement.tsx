import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Upload, Image, GripVertical } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
}

const empty = (): Omit<Banner, 'id'> => ({
  title: '', subtitle: '', image_url: '', link_url: '', is_active: true, display_order: 0,
});

export const BannerManagement: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty());
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('banners')
      .select('*')
      .order('display_order', { ascending: true });
    setBanners((data as Banner[]) || []);
    setLoading(false);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('banners').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('banners').getPublicUrl(path);
      setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
      toast({ title: 'Uploaded', description: 'Image uploaded successfully' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    setSaving('new');
    const { error } = await supabase.from('banners').insert([{
      ...form,
      display_order: banners.length,
    }]);
    setSaving(null);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Created', description: 'Banner added' });
      setForm(empty());
      setShowForm(false);
      fetchBanners();
    }
  };

  const toggleActive = async (banner: Banner) => {
    setSaving(banner.id);
    await supabase.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id);
    setSaving(null);
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    toast({ title: 'Deleted' });
    fetchBanners();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Banner Management</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Banner
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Banner</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Title *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Banner title" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Subtitle</Label>
                <Input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Short description" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Link URL</Label>
                <Input value={form.link_url} onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))} placeholder="/cabins" className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Image</Label>
                <div className="flex gap-2">
                  <Input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} placeholder="URL or upload" className="h-9 text-sm flex-1" />
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" className="h-9 px-2.5" asChild>
                      <span>
                        {uploading ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                      </span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </div>
            {form.image_url && (
              <img src={form.image_url} alt="preview" className="h-24 rounded-xl object-cover" />
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm(empty()); }}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={!form.title || saving === 'new'}>
                {saving === 'new' ? 'Saving…' : 'Save Banner'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No banners yet. Add one above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {banners.map((b) => (
            <Card key={b.id} className={b.is_active ? '' : 'opacity-60'}>
              <CardContent className="p-3 flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab" />
                <div className="w-16 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {b.image_url ? (
                    <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{b.title}</p>
                  {b.subtitle && <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>}
                  {b.link_url && <p className="text-xs text-primary truncate">{b.link_url}</p>}
                </div>
                <Switch
                  checked={b.is_active}
                  onCheckedChange={() => toggleActive(b)}
                  disabled={saving === b.id}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(b.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerManagement;
