import { useState } from "react";
import MasterPasswordScreen from "@/components/MasterPasswordScreen";
import VaultDashboard from "@/components/VaultDashboard";

const Index = () => {
  const [masterPassword, setMasterPassword] = useState<string | null>(null);

  if (!masterPassword) {
    return <MasterPasswordScreen onUnlock={setMasterPassword} />;
  }

  return <VaultDashboard masterPassword={masterPassword} onLock={() => setMasterPassword(null)} />;
};

export default Index;
