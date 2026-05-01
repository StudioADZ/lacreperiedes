import { motion } from 'framer-motion';
import SecretMenuAdminPanel from './SecretMenuAdminPanel';

interface CarteMenuPanelProps {
  adminPassword: string;
}

const CarteMenuPanel = ({ adminPassword }: CarteMenuPanelProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <SecretMenuAdminPanel adminPassword={adminPassword} />
    </motion.div>
  );
};

export default CarteMenuPanel;
