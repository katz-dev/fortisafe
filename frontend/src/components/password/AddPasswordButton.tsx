import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface AddPasswordButtonProps {
    onClick: () => void;
}

export default function AddPasswordButton({ onClick }: AddPasswordButtonProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            <Button
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 px-4 py-2 h-auto font-medium"
                onClick={onClick}
            >
                <Plus className="h-4 w-4 mr-2" strokeWidth={2.5} />
                Add password
            </Button>
        </motion.div>
    );
}
