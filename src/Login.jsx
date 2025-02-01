import { useState } from "react";

function App() {
  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="h-screen flex justify-center items-center relative">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Login/Register Form */}
      <div className="relative z-10 bg-black-500 bg-opacity-50 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-96">
        {/* Gradient heading */}
        <h1 className="text-4xl font-bold text-center blur-[0.5px]">
          <span className="bg-gradient-to-r from-green-500 to-blue-600 inline-block text-transparent bg-clip-text">
            PORTAL GAMBIT
          </span>
        </h1>

        {isRegister ? (
          // Register Form
          <>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full bg-white py-2 px-3 mt-4 rounded focus:ring-2 focus:ring-green-400"
            />
            <input
              type="number"
              placeholder="Age"
              className="w-full bg-white py-2 px-3 mt-4 rounded focus:ring-2 focus:ring-green-400"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-white py-2 px-3 mt-4 rounded focus:ring-2 focus:ring-green-400"
            />
            <button className="w-full bg-gradient-to-r from-green-400 to-yellow-400 py-2 mt-4 rounded text-white font-bold hover:opacity-80 transition">
              Register
            </button>
            <p className="text-center text-white mt-2">
              Already have an account?{" "}
              <span
                className="text-green-400 hover:text-yellow-300 cursor-pointer transition"
                onClick={() => setIsRegister(false)}
              >
                Login here
              </span>
            </p>
          </>
        ) : (
          // Login Form
          <>
            {/* Google Sign-In Button */}
            <button className="w-full bg-white text-gray-700 py-2 px-4 mt-4 rounded border border-gray-300 font-roboto text-sm font-medium hover:bg-gray-50 hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 48 48" 
                className="w-4 h-4"
              >
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign in with Google
            </button>

            {/* Input Fields */}
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-white py-2 px-3 mt-4 rounded focus:ring-2 focus:ring-green-400"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-white py-2 px-3 mt-4 rounded focus:ring-2 focus:ring-green-400"
            />

            {/* Login Button */}
            <button className="w-full bg-gradient-to-r from-green-400 to-yellow-400 py-2 mt-4 rounded text-white font-bold hover:opacity-80 transition">
              Login
            </button>

            {/* Register Link */}
            <p className="text-center text-white mt-2">
              Don't have an account?{" "}
              <span
                className="text-green-400 hover:text-yellow-300 cursor-pointer transition"
                onClick={() => setIsRegister(true)}
              >
                Create one here
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
