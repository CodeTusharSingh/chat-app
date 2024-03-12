import { initializeApp } from "firebase/app";
import firebaseConfig from "../firebaseConfig";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function SignOut() {
    const history = useNavigate();
    signOut(auth)
        .then(() => {
            console.log('Good Bye!!!');
            history('/');
        }).catch((error) => {
            console.error('Error signing out: ', error);
        })
    return (
        <>
            <h1 style={{ fontFamily: 'roboto' }}>Good Bye!!!!</h1>
        </>
    )
}

export default SignOut;