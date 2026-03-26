import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import animationData from '../../logo.json';

interface Props {
  onDone: () => void;
}

const SplashScreen = ({ onDone }: Props) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: '#100f14' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Lottie
            animationData={animationData}
            loop={false}
            style={{ width: 160, height: 160 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
