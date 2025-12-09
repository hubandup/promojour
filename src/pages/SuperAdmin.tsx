import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserData } from "@/hooks/use-user-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Building2, 
  Store, 
  Users, 
  Tag, 
  Trash2, 
  ShieldCheck,
  Search,
  Download,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";

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
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
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
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  
  // Filters
  const [orgSearch, setOrgSearch] = useState("");
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>("all");
  const [storeSearch, setStoreSearch] = useState("");
  const [storeStatusFilter, setStoreStatusFilter] = useState<string>("all");
  
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
      await supabase.from('user_roles').delete().eq('organization_id', orgId);
      await supabase.from('promotions').delete().eq('organization_id', orgId);
      await supabase.from('campaigns').delete().eq('organization_id', orgId);
      await supabase.from('stores').delete().eq('organization_id', orgId);
      await supabase.from('profiles').update({ organization_id: null }).eq('organization_id', orgId);
      const { error } = await supabase.from('organizations').delete().eq('id', orgId);
      
      if (error) throw error;

      toast.success(`Organisation "${orgName}" supprimée`);
      setSelectedOrgs(prev => prev.filter(id => id !== orgId));
      fetchData();
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteSelectedOrgs = async () => {
    try {
      for (const orgId of selectedOrgs) {
        await supabase.from('user_roles').delete().eq('organization_id', orgId);
        await supabase.from('promotions').delete().eq('organization_id', orgId);
        await supabase.from('campaigns').delete().eq('organization_id', orgId);
        await supabase.from('stores').delete().eq('organization_id', orgId);
        await supabase.from('profiles').update({ organization_id: null }).eq('organization_id', orgId);
        await supabase.from('organizations').delete().eq('id', orgId);
      }
      toast.success(`${selectedOrgs.length} organisation(s) supprimée(s)`);
      setSelectedOrgs([]);
      fetchData();
    } catch (error) {
      console.error('Error deleting organizations:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteSelectedStores = async () => {
    try {
      for (const storeId of selectedStores) {
        await supabase.from('stores').delete().eq('id', storeId);
      }
      toast.success(`${selectedStores.length} magasin(s) supprimé(s)`);
      setSelectedStores([]);
      fetchData();
    } catch (error) {
      console.error('Error deleting stores:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const toggleOrgSelection = (orgId: string) => {
    setSelectedOrgs(prev => 
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId) ? prev.filter(id => id !== storeId) : [...prev, storeId]
    );
  };

  const toggleAllOrgs = () => {
    if (selectedOrgs.length === organizations.length) {
      setSelectedOrgs([]);
    } else {
      setSelectedOrgs(organizations.map(o => o.id));
    }
  };

  const toggleAllStores = () => {
    if (selectedStores.length === stores.length) {
      setSelectedStores([]);
    } else {
      setSelectedStores(stores.map(s => s.id));
    }
  };

  // Filtered data
  const filteredOrgs = useMemo(() => {
    return organizations.filter(org => {
      const matchesSearch = org.name.toLowerCase().includes(orgSearch.toLowerCase());
      const matchesType = orgTypeFilter === "all" || org.account_type === orgTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [organizations, orgSearch, orgTypeFilter]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
                           store.organization_name.toLowerCase().includes(storeSearch.toLowerCase()) ||
                           (store.city?.toLowerCase().includes(storeSearch.toLowerCase()) ?? false);
      const matchesStatus = storeStatusFilter === "all" || 
                           (storeStatusFilter === "active" && store.is_active) ||
                           (storeStatusFilter === "inactive" && !store.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [stores, storeSearch, storeStatusFilter]);

  // Export functions
  const exportOrgsToXLS = () => {
    const data = filteredOrgs.map(org => ({
      "Nom": org.name,
      "Type": org.account_type === 'free' ? 'Free' : org.account_type === 'store' ? 'Pro' : 'Centrale',
      "Statut": org.subscription_status || 'N/A',
      "Magasins": org.stores_count,
      "Promotions": org.promotions_count,
      "Utilisateurs": org.users_count,
      "Créé le": format(new Date(org.created_at), 'dd/MM/yyyy', { locale: fr })
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Organisations");
    XLSX.writeFile(wb, `organisations_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success("Export XLS téléchargé");
  };

  const exportStoresToXLS = () => {
    const data = filteredStores.map(store => ({
      "Nom": store.name,
      "Organisation": store.organization_name,
      "Adresse": store.address_line1 || '-',
      "Complément": store.address_line2 || '',
      "Code postal": store.postal_code || '-',
      "Ville": store.city || '-',
      "Pays": store.country || 'France',
      "Email": store.email || '-',
      "Téléphone": store.phone || '-',
      "Statut": store.is_active ? 'Actif' : 'Inactif',
      "Promotions": store.promotions_count,
      "Réseaux sociaux": store.social_connections_count,
      "Créé le": format(new Date(store.created_at), 'dd/MM/yyyy', { locale: fr })
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Magasins");
    XLSX.writeFile(wb, `magasins_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success("Export XLS téléchargé");
  };

  const handleChangeAccountType = async (orgId: string, newType: 'free' | 'store' | 'central') => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ account_type: newType })
        .eq('id', orgId);

      if (error) throw error;

      setOrganizations(prev => 
        prev.map(org => org.id === orgId ? { ...org, account_type: newType } : org)
      );

      const typeLabels = { free: 'Free', store: 'Pro', central: 'Centrale' };
      toast.success(`Type d'abonnement modifié en "${typeLabels[newType]}"`);
    } catch (error: any) {
      console.error('Error updating account type:', error);
      toast.error("Erreur lors de la modification du type d'abonnement");
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
            <CardHeader className="space-y-4">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Toutes les organisations</CardTitle>
                  <CardDescription>Liste de tous les comptes créés sur PromoJour</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportOrgsToXLS} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export XLS
                  </Button>
                  {selectedOrgs.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Supprimer ({selectedOrgs.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer {selectedOrgs.length} organisation(s) ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action supprimera définitivement les organisations sélectionnées et toutes leurs données associées. Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteSelectedOrgs}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom..."
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={orgTypeFilter} onValueChange={setOrgTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="store">Pro</SelectItem>
                    <SelectItem value="central">Centrale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedOrgs.length === organizations.length && organizations.length > 0}
                        onCheckedChange={toggleAllOrgs}
                      />
                    </TableHead>
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
                  {filteredOrgs.map((org) => (
                    <TableRow key={org.id} className={selectedOrgs.includes(org.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrgs.includes(org.id)}
                          onCheckedChange={() => toggleOrgSelection(org.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Select 
                          value={org.account_type} 
                          onValueChange={(value: 'free' | 'store' | 'central') => handleChangeAccountType(org.id, value)}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">
                              <Badge variant="secondary">Free</Badge>
                            </SelectItem>
                            <SelectItem value="store">
                              <Badge variant="default">Pro</Badge>
                            </SelectItem>
                            <SelectItem value="central">
                              <Badge variant="destructive">Centrale</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
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
            <CardHeader className="space-y-4">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Tous les magasins</CardTitle>
                  <CardDescription>Liste de tous les magasins enregistrés</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportStoresToXLS} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export XLS
                  </Button>
                  {selectedStores.length > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Supprimer ({selectedStores.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer {selectedStores.length} magasin(s) ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action supprimera définitivement les magasins sélectionnés et toutes leurs données associées. Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteSelectedStores}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, organisation, ville..."
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={storeStatusFilter} onValueChange={setStoreStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedStores.length === stores.length && stores.length > 0}
                        onCheckedChange={toggleAllStores}
                      />
                    </TableHead>
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
                  {filteredStores.map((store) => (
                    <TableRow key={store.id} className={selectedStores.includes(store.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedStores.includes(store.id)}
                          onCheckedChange={() => toggleStoreSelection(store.id)}
                        />
                      </TableCell>
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
