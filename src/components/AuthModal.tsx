// import React from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuthModal } from "../context/AuthModalContext";
// import Login from "../login/Login";
// import Signup from "../login/Signup";
// import { X } from "lucide-react";

// const AuthModal = () => {
//   const { isOpen, closeAuthModal, isLogin, setIsLogin } = useAuthModal();

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//         >
//           <motion.div
//             className="relative bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl w-[90%] max-w-[450px] p-6 sm:p-8"
//             initial={{ opacity: 0, scale: 0.8 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.8 }}
//             transition={{ duration: 0.25, ease: "easeInOut" }}
//           >
//             {/* Close Button */}
//             <button
//               onClick={closeAuthModal}
//               className="absolute top-3 right-3 text-gray-700 hover:text-black transition"
//             >
//               <X size={20} />
//             </button>

//             {/* Header */}
//             <h2 className="text-center text-lg font-semibold text-gray-900 mb-4">
//               {isLogin ? "Welcome Back 👋" : "Create Your Account ✨"}
//             </h2>

//             {/* Form (your existing ones) */}
//             <div className="overflow-y-auto max-h-[70vh]">
//               {isLogin ? <Login /> : <Signup />}
//             </div>

//             {/* Switch Link */}
//             <p className="text-center text-sm text-gray-700 mt-4">
//               {isLogin ? (
//                 <>
//                   Don’t have an account?{" "}
//                   <span
//                     onClick={() => setIsLogin(false)}
//                     className="font-semibold text-[#343e32] cursor-pointer hover:underline"
//                   >
//                     Sign up
//                   </span>
//                 </>
//               ) : (
//                 <>
//                   Already have an account?{" "}
//                   <span
//                     onClick={() => setIsLogin(true)}
//                     className="font-semibold text-[#343e32] cursor-pointer hover:underline"
//                   >
//                     Login
//                   </span>
//                 </>
//               )}
//             </p>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// };

// export default AuthModal;
