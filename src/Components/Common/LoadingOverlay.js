import React from 'react';

const LoadingOverlay = ({ fullScreen = false, isLoading = true, children }) => {
  const overlayStyle = {
    position: fullScreen ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050
  };

  const spinnerWrapperStyle = {
    textAlign: 'center'
  };

  const textStyle = {
    color: '#fff',
    marginTop: '10px',
    fontWeight: '500'
  };

  const spinner = (
    <div style={overlayStyle}>
      <div style={spinnerWrapperStyle}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div style={textStyle}>Loading...</div>
      </div>
    </div>
  );

  // Wrapper mode: render children + conditional overlay
  if (children !== undefined) {
    return (
      <div style={{ position: 'relative', minHeight: isLoading ? 120 : 'auto' }}>
        {children}
        {isLoading && spinner}
      </div>
    );
  }

  // Standalone mode (existing pattern: {isLoading && <LoadingOverlay />})
  return spinner;
};

export default LoadingOverlay;