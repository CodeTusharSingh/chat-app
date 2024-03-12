import './home.css';
import '@fontsource/roboto/400.css';
import { TextField, Button } from '@mui/material';
import { initializeApp } from 'firebase/app'
import firebaseConfig from '../firebaseConfig';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { getFirestore, setDoc, doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);


function Home() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [signIn, setSignIn] = useState(false);
    const [userName, setUserName] = useState('');
    const [userEmailId, setUserEmailId] = useState('');
    const [userPhotoURL, setUserPhotoUrl] = useState('');

    const history = useNavigate();

    const handleSignUpSignIn = (event) => {
        event.preventDefault();
        if (!signIn) {
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    setUserName(name);
                    setUserPhotoUrl('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png')
                    console.log(user)
                })
                .catch((error) => {
                    const errorCode = error.code;
                    console.log(errorCode)
                    const errorMessage = error.message;
                    console.log(errorMessage)
                });
        } else {
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    history('/welcome')
                    console.log(user)
                })
                .catch((error) => {
                    const errorCode = error.code;
                    console.log(errorCode)
                    const errorMessage = error.message;
                    console.log(errorMessage)
                })
        }
    }

    const googleSignIn = () => {
        signInWithPopup(auth, provider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                const user = result.user;
                console.log(token)
                console.log(user)
            }).catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.customData.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
                console.log(errorCode);
                console.log(errorMessage);
                console.log(email);
                console.log(credential);
            })
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const uid = user.uid;
                console.log(uid);
                console.log("Signed In");
                user.providerData.forEach((profile) => {
                    console.log("Sign-in provider: " + profile.providerId);
                    console.log("Provider-specific UID: " + profile.uid);
                    console.log("Name: " + profile.displayName);
                    setUserName(profile.displayName);
                    console.log("Email: " + profile.email);
                    setUserEmailId(profile.email);
                    console.log("Photo URL: " + profile.photoURL);
                    setUserPhotoUrl(profile.photoURL);
                })

            } else {
                console.log("Not Signed In");
            }
        });
        return () => unsubscribe();
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const documentRef = doc(db, `chatAppUserData/${userEmailId}`);
            getDoc(documentRef)
                .then((documentSnapshot) => {
                    if (documentSnapshot.data().name != null) {
                        history('/welcome')
                    }
                }).catch((error) => {
                    console.error("Error fetching data: ", error);
                })
            if (userEmailId != '' && userName != null) {
                try {
                    // const docRef = await addDoc(collection(db, "chatAppUserData"), {
                    //     name: userName,
                    //     email: userEmailId,
                    //     photoURL: userPhotoURL
                    // })
                    await setDoc(doc(db, "chatAppUserData", userEmailId), {
                        name: userName,
                        email: userEmailId,
                        photoURL: userPhotoURL
                    })
                    console.log("Document added successfully");

                } catch (error) {
                    console.log("Error adding document: ", error);
                }
            }
        }
        fetchData();
    }, [userName, userEmailId, userPhotoURL, history])


    return (
        <>
            <div id='home-container-div'>
                <img src='https://github.com/CodeTusharSingh/chat-app/raw/fce1dca8e40ee408fdf2c3f1e27071c2d7521ece/chat-app-img.png' title='Chat App' alt='Chat App'></img>
                <div id='home-sign-up-container'>
                    {signIn && <h1 style={{ fontFamily: 'roboto', color: 'black' }}>Sign In</h1>}
                    {!signIn && <h1 style={{ fontFamily: 'roboto', color: 'black' }}>Sign Up</h1>}
                    <form id='sign-up-form' onSubmit={handleSignUpSignIn}>
                        <TextField id="sign-up-email" label="Email" variant="outlined" type='email'
                            // InputProps={{
                            //     style: { color: 'white' }
                            // }}
                            // InputLabelProps={{
                            //     style: { color: 'white' }
                            // }}
                            value={email}
                            onChange={(event) => {
                                const newEmail = event.target.value;
                                setEmail(newEmail);
                            }}
                            fullWidth />
                        <br></br>
                        <br></br>
                        <TextField id="sign-up-password" label="Password" variant="outlined" type='password' autoComplete="current-password"
                            // InputProps={{
                            //     style: { color: 'white' }
                            // }}
                            // InputLabelProps={{
                            //     style: { color: 'white' }
                            // }}
                            value={password}
                            onChange={(event) => {
                                const newPassword = event.target.value;
                                setPassword(newPassword);
                            }}
                            fullWidth />
                        <br></br>
                        <br></br>
                        {!signIn &&
                            <>
                                <TextField id="sign-up-name" label="Name" variant="outlined" type='text'
                                    // InputProps={{
                                    //     style: { color: 'white' }
                                    // }}
                                    // InputLabelProps={{
                                    //     style: { color: 'white' }
                                    // }}
                                    value={name}
                                    onChange={(event) => {
                                        const newName = event.target.value;
                                        setName(newName);
                                    }}
                                    fullWidth />
                                <br></br>
                                <br></br>
                            </>
                        }
                        {signIn && <Button id='sign-up-button' type='submit' variant="contained">Sign In</Button>}
                        {!signIn && <Button id='sign-up-button' type='submit' variant="contained">Sign Up</Button>}
                        <br></br>
                        <br></br>
                        {signIn && <Button id='already-sign-up-button' onClick={() => {
                            setSignIn(false)
                        }} variant="text">Sign Up</Button>}
                        {!signIn && <Button id='already-sign-up-button' onClick={() => {
                            setSignIn(true)
                        }} variant="text">Already have a account? Sign In</Button>}

                        <br></br>
                        <br></br>
                    </form>
                    <Button id='sign-in-with-google' onClick={googleSignIn} variant="contained">Sign In With Google</Button>
                </div>
            </div>
        </>
    )
}

export default Home;
