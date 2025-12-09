import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/use-user-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Building2, 
  Store, 
  Users, 
  Tag, 
  Trash2, 
  Calendar,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Organization {
  id: string;
  name: string;
  account_type: 'free' | 'store' | 'central';
  created_at: string;
  subscription_status: string | null;
  stores_count?: number;
  promotions_count?: number;
  users_count?: number;
}

interface StoreData {
  id: string;
  name: string;
  city: string | null;
  is_active: boolean;
  created_at: string;
  organization_name: string;
  promotions_count?: number;
  social_connections_count?: number;
}

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: userLoading } = useUserData();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalStores: 0,
    totalPromotions: 0,
    totalUsers: 0,
    freeOrgs: 0,
    proOrgs: 0,
    centralOrgs: 0
  });

  useEffect(() => {
    if (!userLoading && !isSuperAdmin) {
      navigate("/dashboard");
      return;
    }
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin, userLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all organizations with counts
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Fetch stores count per org
      const { data: storesCounts } = await supabase
        .from('stores')
        .select('organization_id');

      // Fetch promotions count per org
      const { data: promosCounts } = await supabase
        .from('promotions')
        .select('organization_id');

      // Fetch users count per org
      const { data: usersCounts } = await supabase
        .from('profiles')
        .select('organization_id');

      // Enrich orgs with counts
      const enrichedOrgs = orgsData?.map(org => ({
        ...org,
        stores_count: storesCounts?.filter(s => s.organization_id === org.id).length || 0,
        promotions_count: promosCounts?.filter(p => p.organization_id === org.id).length || 0,
        users_count: usersCounts?.filter(u => u.organization_id === org.id).length || 0
      })) || [];

      setOrganizations(enrichedOrgs);

      // Fetch all stores with org name
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select(`
          *,
          organizations:organization_id (name)
        `)
        .order('created_at', { ascending: false });

      if (storesError) throw storesError;

      // Fetch promotions count per store
      const { data: promosPerStore } = await supabase
        .from('promotions')
        .select('store_id');

      // Fetch social connections count per store
      const { data: socialPerStore } = await supabase
        .from('social_connections')
        .select('store_id');

      const enrichedStores = storesData?.map(store => ({
        ...store,
        organization_name: (store.organizations as any)?.name || 'N/A',
        promotions_count: promosPerStore?.filter(p => p.store_id === store.id).length || 0,
        social_connections_count: socialPerStore?.filter(s => s.store_id === store.id).length || 0
      })) || [];

      setStores(enrichedStores);

      // Calculate stats
      setStats({
        totalOrgs: enrichedOrgs.length,
        totalStores: enrichedStores.length,
        totalPromotions: promosCounts?.length || 0,
        totalUsers: usersCounts?.length || 0,
        freeOrgs: enrichedOrgs.filter(o => o.account_type === 'free').length,
        proOrgs: enrichedOrgs.filter(o => o.account_type === 'store').length,
        centralOrgs: enrichedOrgs.filter(o => o.account_type === 'central').length
      });

    } catch (error) {
      console.error('Error fetching super admin data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    try {
      // Delete in order: user_roles, profiles, promotions, stores, organization
      // Note: Due to cascading, most should delete automatically, but we'll be explicit

      // Delete user roles
      await supabase.from('user_roles').delete().eq('organization_id', orgId);
      
      // Delete promotions
      await supabase.from('promotions').delete().eq('organization_id', orgId);
      
      // Delete campaigns
      await supabase.from('campaigns').delete().eq('organization_id', orgId);
      
      // Delete stores (this will cascade to social_connections, store_settings, etc.)
      await supabase.from('stores').delete().eq('organization_id', orgId);
      
      // Delete profiles linked to this org
      await supabase.from('profiles').update({ organization_id: null }).eq('organization_id', orgId);
      
      // Finally delete the organization
      const { error } = await supabase.from('organizations').delete().eq('id', orgId);
      
      if (error) throw error;

      toast.success(`Organisation "${orgName}" supprimée`);
      fetchData();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getAccountTypeBadge = (type: 'free' | 'store' | 'central') => {
    const configs = {
      free: { label: 'Free', variant: 'secondary' as const },
      store: { label: 'Pro', variant: 'default' as const },
      central: { label: 'Centrale', variant: 'destructive' as const }
    };
    return <Badge variant={configs[type].variant}>{configs[type].label}</Badge>;
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground">Gestion des comptes et magasins PromoJour</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Organisations</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalOrgs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Magasins</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalStores}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Promotions</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalPromotions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Utilisateurs</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <span className="text-sm text-muted-foreground">Free</span>
            <p className="text-2xl font-bold mt-1">{stats.freeOrgs}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10">
          <CardContent className="pt-4">
            <span className="text-sm text-muted-foreground">Pro</span>
            <p className="text-2xl font-bold mt-1">{stats.proOrgs}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10">
          <CardContent className="pt-4">
            <span className="text-sm text-muted-foreground">Centrale</span>
            <p className="text-2xl font-bold mt-1">{stats.centralOrgs}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations" className="gap-2">
            <Building2 className="w-4 h-4" />
            Organisations ({organizations.length})
          </TabsTrigger>
          <TabsTrigger value="stores" className="gap-2">
            <Store className="w-4 h-4" />
            Magasins ({stores.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Toutes les organisations</CardTitle>
              <CardDescription>Liste de tous les comptes créés sur PromoJour</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center">Magasins</TableHead>
                    <TableHead className="text-center">Promos</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>{getAccountTypeBadge(org.account_type)}</TableCell>
                      <TableCell>
                        <Badge variant={org.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {org.subscription_status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{org.stores_count}</TableCell>
                      <TableCell className="text-center">{org.promotions_count}</TableCell>
                      <TableCell className="text-center">{org.users_count}</TableCell>
                      <TableCell>
                        {format(new Date(org.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer l'organisation ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action supprimera définitivement l'organisation "{org.name}" et toutes ses données associées (magasins, promotions, utilisateurs). Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteOrganization(org.id, org.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores">
          <Card>
            <CardHeader>
              <CardTitle>Tous les magasins</CardTitle>
              <CardDescription>Liste de tous les magasins enregistrés</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-center">Promos</TableHead>
                    <TableHead className="text-center">Réseaux</TableHead>
                    <TableHead>Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell className="text-muted-foreground">{store.organization_name}</TableCell>
                      <TableCell>{store.city || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={store.is_active ? 'default' : 'secondary'}>
                          {store.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{store.promotions_count}</TableCell>
                      <TableCell className="text-center">{store.social_connections_count}</TableCell>
                      <TableCell>
                        {format(new Date(store.created_at), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdmin;
