module.exports = {
    api: { 
        API_URL:
            process.env.NODE_ENV === "production"
                ? (process.env.REACT_APP_API_URL_PROD || "https://api.supermerch.com.au")
                : (process.env.REACT_APP_API_URL_DEV || "http://localhost:5000"),
    },
};
