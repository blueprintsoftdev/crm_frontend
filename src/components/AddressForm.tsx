import React from "react";
import api from "../utils/api";
import toast, { Toaster } from "react-hot-toast";

interface Address {
  name: string;
  phone: string;
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  shippingCharge?: number;
}

interface AddressFormProps {
  address: Address;
  setAddress: React.Dispatch<React.SetStateAction<Address>>;
}

const AddressForm = ({ address, setAddress }: AddressFormProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setAddress({ ...address, phone: digits });
    } else {
      setAddress({ ...address, [name]: value });
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post("/save-geo", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });

          const { address: addr, shippingCharge } = res.data;

          setAddress((prev) => ({
            ...prev,
            house: addr.fullAddress,
            city: addr.city,
            state: addr.state,
            pincode: addr.zipCode,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            shippingCharge,
          }));

          toast.success(`Shipping charge: ₹${shippingCharge}`);
        } catch {
          toast.error("Failed to fetch location");
        }
      },
      () => toast.error("Location permission denied")
    );
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
      <div className="space-y-4">
        <input
          name="name"
          placeholder="Full Name"
          value={address.name}
          onChange={handleChange}
          className="input"
        />
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="Phone Number (10 digits)"
          value={address.phone}
          onChange={handleChange}
          className="input"
        />
        <input
          name="house"
          placeholder="House / Flat"
          value={address.house}
          onChange={handleChange}
          className="input"
        />
        <input
          name="street"
          placeholder="Street / Area"
          value={address.street}
          onChange={handleChange}
          className="input"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            name="city"
            placeholder="City"
            value={address.city}
            onChange={handleChange}
            className="input"
          />
          <input
            name="state"
            placeholder="State"
            value={address.state}
            onChange={handleChange}
            className="input"
          />
        </div>
        <input
          name="pincode"
          placeholder="Pincode"
          value={address.pincode}
          onChange={handleChange}
          className="input"
        />
      </div>
      <button
        type="button"
        onClick={handleGetLocation}
        className="w-full border rounded-md py-2 text-sm hover:bg-gray-50 mt-4"
      >
        📍 Use Current Location
      </button>
      <Toaster position="top-right" toastOptions={{ duration: 2000 }} />
    </div>
  );
};

export default AddressForm;
