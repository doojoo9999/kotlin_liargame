import {motion} from 'framer-motion'

const FadeInUp = ({ children, delay = 0, ...props }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    {...props}
  >
    {children}
  </motion.div>
)

export default FadeInUp