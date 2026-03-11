import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

const TestPayment = () => {
  const navigate = useNavigate();

  const startPayment = async () => {
    try {
      // TEMP amount for testing
      const res = await api.post("/order/create", {
        amount: 1000, // ₹1000
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: res.data.rzpOrder.amount,
        currency: "INR",
        name: "blueprint_crm",
        order_id: res.data.rzpOrder.id,

        handler: async (response: any) => {
          const verifyRes = await api.post("/order/verify", response);
          navigate("/my-orders");
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      const _e = err as any;
      toast.error("Payment failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        onClick={startPayment}
        className="bg-black text-white px-6 py-3 rounded"
      >
        Test Pay ₹1000
      </button>
       <Toaster
                                position="top-right"
                                toastOptions={{
                                  duration: 2000,
                                  style: {
                                    borderRadius: "10px",
                                    fontFamily: "Inter, sans-serif",
                                  },
                                }}
                              />
    </div>
    
  );
};

export default TestPayment;
