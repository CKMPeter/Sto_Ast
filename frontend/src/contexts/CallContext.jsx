import { createContext, useContext, useState } from "react";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const [call, setCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  return (
    <CallContext.Provider
      value={{
        call,
        setCall,
        incomingCall,
        setIncomingCall
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCallContext = () => useContext(CallContext);