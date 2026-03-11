import React from "react";
import { PropagateLoader } from "react-spinners";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Propagate Loader */}
      <PropagateLoader color="#8aca8d" />

      {/* Message */}
      <p className="mt-4 text-gray-600 text-sm font-medium"></p>
    </div>
  );
};

export default Loader;

