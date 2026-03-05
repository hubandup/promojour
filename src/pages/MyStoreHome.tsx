import { Store } from "lucide-react";

const MyStoreHome = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <Store className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mon Magasin</h1>
          <p className="text-muted-foreground">Bienvenue dans votre espace</p>
        </div>
      </div>
    </div>
  );
};

export default MyStoreHome;
