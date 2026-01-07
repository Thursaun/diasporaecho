import React from "react";


const CurrentUserContext = React.createContext({
    currentUser: null,
    loggedIn: false,
});

export default CurrentUserContext;