import firebaseConfig from "../firebaseConfig";
import { initializeApp } from "firebase/app";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, TextField, ButtonGroup } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SignOut from "./signOut";
import './welcome.css'




const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function Welcome() {
    const [userEmailId, setUserEmailId] = useState('');
    const [userName, setUserName] = useState('');
    const [userPhotoURL, setUserPhotURL] = useState('');

    const [participantEmailId, setParticipantEmailId] = useState('');
    const [participantName, setParticipantName] = useState('');
    const [participantPhotoURL, setParticipantPhotURL] = useState('');

    const [groupAdd, setGroupAdd] = useState('');
    const [groupRemove, setGroupRemove] = useState('');

    const [signOut, setSignOut] = useState(false);

    const [chatRoomName, setChatRoomName] = useState('');
    const [chatRoomAdd, setChatRoomAdd] = useState(0);


    const history = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // const uid = user.uid;
                // console.log(uid);
                setUserEmailId(user.email);
            } else {
                history('/');
                console.log("Not Signed In");
            }
        })
        return () => unsubscribe();
    }, [history])
    const userList = useRef([]);
    useEffect(() => {
        if (userEmailId != '') {
            const documentRef = doc(db, `chatAppUserData/${userEmailId}`);
            getDoc(documentRef)
                .then((documentSnapshot) => {
                    // console.log(documentSnapshot.data())
                    setUserName(documentSnapshot.data().name);
                    setUserPhotURL(documentSnapshot.data().photoURL);
                }).catch((error) => {
                    console.error("Error retriving user data: ", error);
                })
            const documentsRef = collection(db, 'chatAppUserData');
            getDocs(documentsRef)
                .then((QuerySnapshot) => {
                    // console.log(QuerySnapshot.docs[0]._document.data.value.mapValue.fields.email)
                    userList.current = QuerySnapshot.docs.map((doc) => doc.data())
                }).catch((error) => {
                    console.error("Error retriving user list: ", error);
                })
        }
    }, [userEmailId])

    const [chatRoomPresent, setChatRoomPresent] = useState(false);

    useEffect(() => {
        const docsRef = collection(db, 'chatRoom');
        setChatRoomPresent(false)
        getDocs(docsRef)
            .then((QuerySnapshot) => {
                QuerySnapshot.forEach((doc) => {
                    if ((doc.data().member1 === userEmailId && doc.data().member2 === participantEmailId) || (doc.data().member2 === userEmailId && doc.data().member1 === participantEmailId) || doc.data().roomName === chatRoomName) {
                        setChatRoomPresent(true)
                    }
                })
            }).catch((error) => {
                console.error('Error adding fetching document:', error);
            })
    }, [participantEmailId, userEmailId, chatRoomName])



    const createChatRoom = () => {
        if (!chatRoomPresent) {
            if (chatRoomName != '' && participantEmailId != '') {
                setDoc(doc(db, `chatRoom`, `${chatRoomName}`), {
                    roomName: chatRoomName,
                    member1: userEmailId,
                    member2: participantEmailId,
                    photo1: userPhotoURL,
                    photo2: participantPhotoURL
                })
                    .then(() => {
                        console.log("Room Created");
                        setChatRoomAdd(chatRoomAdd + 1);
                        setShowCreateChatRoom(false)
                        addDoc(collection(doc(db, 'chatRoom', `${chatRoomName}`), 'messages'), {})
                            .then((docRef) => {
                                setChatRoomName('')
                                setParticipantPhotURL('');
                                setParticipantName('')
                                setParticipantEmailId('')
                                console.log('Document added to subcollection with ID:', docRef.id);
                            })
                            .catch((error) => {
                                console.error('Error adding document to subcollection:', error);
                            })
                    }).catch((error) => {
                        console.log("Error Creating Room: ", error)
                    })
            }
        } else if (chatRoomPresent) {
            console.log('Chat room already created with this user!!!')
        }
    }

    const chatRoomList = useRef([]);
    const [chatRoomListState, setChatRoomListState] = useState([]);

    useEffect(() => {
        console.log(chatRoomAdd)
        const docRef = collection(db, 'chatRoom');
        const unsubscribe = onSnapshot(docRef, (querySnapshot) => {
            if (chatRoomList.current)
                chatRoomList.current = querySnapshot.docs.map(doc => doc.data());
            setChatRoomListState(chatRoomList.current)
        });

        return () => unsubscribe();
    }, [chatRoomAdd])

    const [currentRoom, setCurrentRoom] = useState('');
    const [currentRoomPhoto, setCurrentRoomPhoto] = useState('');
    const [sentMessage, setSentMessage] = useState('');
    const [recieveMessage, setRecieveMessage] = useState([]);

    const messageAreaRef = useRef(null);

    const formatDate = (date) => {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();

        hours = (hours < 10) ? '0' + hours : hours;
        minutes = (minutes < 10) ? '0' + minutes : minutes;
        day = (day < 10) ? '0' + day : day;
        month = (month < 10) ? '0' + month : month;

        return hours + ':' + minutes + ' ' + day + '/' + month + '/' + year;
    }

    const sendMessage = () => {
        if (sentMessage != '' && currentRoom != '') {
            addDoc(collection(doc(db, 'chatRoom', `${currentRoom}`), 'messages'), {
                message: sentMessage,
                time: new Date(),
                sentTime: formatDate(new Date()),
                sender: userEmailId,
                senderName: userName,
            }).then((docRef) => {
                setSentMessage("")
                console.log("Message sent: ", docRef.id)
                setDoc(doc(db, 'chatRoom', `${currentRoom}`), {
                    lastMessage: docRef.id
                }, { merge: true }).then(() => {
                    if (messageAreaRef.current)
                        messageAreaRef.current.scrollIntoView({ behavior: 'smooth' });
                }).catch((error) => {
                    console.log("Error ", error)
                })
            }).catch((error) => {
                console.error("Message not sent: ", error)
            })
        }
    }

    const roomRef = useRef([]);


    useEffect(() => {
        try {
            if (currentRoom != '') {
                if (roomRef.current && roomRef.current[currentRoom])
                    roomRef.current[`${currentRoom}`].style.color = 'white';
                const messageRef = collection(db, `chatRoom/${currentRoom}/messages`);
                const orderedMessageRef = query(messageRef, orderBy('time', 'asc'));
                const unsubscribe = onSnapshot(orderedMessageRef, (querySnapshot) => {
                    const messages = querySnapshot.docs.map(doc => {
                        return doc.data()
                    });

                    setRecieveMessage(messages);
                    if (messageAreaRef.current)
                        messageAreaRef.current.scrollIntoView({ behavior: 'smooth' });
                });
                return () => unsubscribe();
            }
        } catch (error) {
            console.log(error)
        }
    }, [currentRoom, sentMessage])


    useEffect(() => {
        const messageRef = collection(db, 'chatRoom');
        const unsubscribe = onSnapshot(messageRef, (querySnapshot) => {
            try {
                querySnapshot.docChanges().forEach((change) => {
                    if (change.type === 'modified') {
                        console.log('Document modified:', change.doc.data().roomName);
                        if (change.doc.data().roomName && currentRoom !== change.doc.data().roomName) {
                            if (roomRef.current && roomRef.current[`${change.doc.data().roomName}`])
                                roomRef.current[`${change.doc.data().roomName}`].style.color = 'green';
                        }
                    }
                });
            } catch (error) {
                console.log(error)
            }
        });
        return () => unsubscribe();

    }, [currentRoom]);


    const groupMemberRef = useRef([]);

    const [groupMember, setGroupMember] = useState([]);


    useEffect(() => {
        console.log(groupMemberRef.current);
        const DocumentsRef = collection(db, 'chatAppUserData');
        getDocs(DocumentsRef)
            .then((querySnapshot) => {
                const grpData = querySnapshot.docs.map((doc) => {
                    if (groupMemberRef.current.indexOf(doc.data().email) != -1) {
                        return doc.data()
                    }
                    return null;
                }
                );
                setGroupMember(grpData);
            }).catch((error) => {
                console.log("Error retriving group data: ", error)
            })
    }, [groupAdd, groupRemove])

    const [groupName, setGroupName] = useState('');

    const createGroup = () => {

        if (groupName != '' && groupMemberRef.current.length !== 0) {
            const check = collection(db, 'chatRoom')
            getDocs(check)
                .then((querySnapshot) => {
                    const nameChecker = querySnapshot.docs.map((doc) => {
                        if (doc.data().groupName === groupName) {
                            return false;
                        }
                        return true;
                    })
                    const memberChecker = querySnapshot.docs.map((doc) => {
                        if (doc.data().members !== undefined) {
                            const arr1 = doc.data().members.slice().sort();
                            const arr2 = groupMemberRef.current.slice().sort();

                            console.log(arr1);
                            console.log(arr2);

                            if (arr1.toString() === arr2.toString()) {
                                return false;
                            }
                        }
                        return true;
                    })
                    console.log(memberChecker)
                    if (nameChecker.indexOf(false) === -1) {
                        if (memberChecker.indexOf(false) === -1) {
                            setDoc(doc(db, 'chatRoom', `${groupName}`), {
                                groupName: groupName,
                                members: groupMemberRef.current,
                                photo: 'https://icons.veryicon.com/png/o/miscellaneous/admin-dashboard-flat-multicolor/user-groups.png'
                            }).then(() => {
                                console.log("Room Created");
                                setShowCreateChatGroup(false);
                                setChatRoomAdd(chatRoomAdd + 1);
                                addDoc(collection(doc(db, 'chatRoom', `${groupName}`), 'messages'), {})
                                    .then((docRef) => {
                                        setGroupName('')
                                        groupMemberRef.current = [];
                                        setGroupAdd('')
                                        setGroupRemove('')
                                        console.log('Document added to subcollection with ID:', docRef.id);
                                    })
                                    .catch((error) => {
                                        console.error('Error adding document to subcollection:', error);
                                    })
                            }).catch((error) => {
                                console.log("Error Creating Room: ", error)
                            })
                        } else {
                            console.log('Group with thses members already exists.')
                        }
                    } else {
                        console.log('Group name already exists.')
                    }
                }).catch((error) => {
                    console.log("Error Checking: ", error);
                })
        }
    }

    const [groupList, setGroupList] = useState([]);

    useEffect(() => {
        try {
            const docRef = collection(db, 'chatRoom');
            const unsubscribe = onSnapshot(docRef, (querySnapshot) => {
                const grpList = querySnapshot.docs.map((doc) => {
                    if (doc.data().members != null) {
                        return doc.data();
                    }
                    return null;
                });
                setGroupList(grpList);
            });
            return () => unsubscribe();
        } catch (error) {
            console.log(error)
        }
    }, [chatRoomAdd])


    const [currentGroup, setCurrentGroup] = useState('');
    const [sentGroupMessage, setSentGroupMessage] = useState('');
    const [recieveGroupMessage, setRecieveGroupMessage] = useState([]);

    const sendGroupMessage = () => {
        if (currentGroup !== '' && sentGroupMessage !== '') {
            addDoc(collection(doc(db, 'chatRoom', `${currentGroup}`), 'messages'), {
                message: sentGroupMessage,
                time: new Date(),
                sentTime: formatDate(new Date()),
                sender: userEmailId,
                senderName: userName
            }).then((docRef) => {
                setSentGroupMessage("")
                console.log("Message sent: ", docRef.id)
                setDoc(doc(db, 'chatRoom', `${currentGroup}`), {
                    lastMessage: docRef.id
                }, { merge: true }).then(() => {
                    if (messageAreaRef.current)
                        messageAreaRef.current.scrollIntoView({ behavior: 'smooth' });
                }).catch((error) => {
                    console.log("Error : ", error)
                })
            }).catch((error) => {
                console.error("Message not sent: ", error)
            })
        }
    }
    const groupRef = useRef([]);

    useEffect(() => {
        try {
            if (currentGroup != '') {
                if (groupRef.current && groupRef.current[currentGroup])
                    groupRef.current[`${currentGroup}`].style.color = 'white';
                const messageRef = collection(db, `chatRoom/${currentGroup}/messages`);
                const orderedMessageRef = query(messageRef, orderBy('time', 'asc'));
                const unsubscribe = onSnapshot(orderedMessageRef, (querySnapshot) => {
                    const messages = querySnapshot.docs.map(doc => doc.data());
                    setRecieveGroupMessage(messages);
                    if (messageAreaRef.current)
                        messageAreaRef.current.scrollIntoView({ behavior: 'smooth' });
                });

                return () => unsubscribe();
            }
        } catch (error) {
            console.log(error)
        }
    }, [currentGroup])


    useEffect(() => {
        try {
            const messageRef = collection(db, 'chatRoom');
            const unsubscribe = onSnapshot(messageRef, (querySnapshot) => {
                querySnapshot.docChanges().forEach((change) => {
                    if (change.type === 'modified') {
                        console.log('Document modified:', change.doc.data().groupName);
                        if (change.doc.data().groupName !== undefined && currentGroup !== change.doc.data().groupName) {
                            if (groupRef.current && groupRef.current[`${change.doc.data().groupName}`])
                                groupRef.current[`${change.doc.data().groupName}`].style.color = 'green';
                        }
                    }
                });
            });
            return () => unsubscribe();
        } catch (error) {
            console.log("Error: ", error)
        }
    }, [currentGroup])


    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const [showCreateChatRoom, setShowCreateChatRoom] = useState(false);

    const [searchChatRoomUser, setSearchChatRoomUser] = useState('');

    const [showCreateChatGroup, setShowCreateChatGroup] = useState(false);


    const searchedUserList = useRef([]);

    const searchUser = (event) => {
        const searchUser = event.target.value;
        setSearchChatRoomUser(searchUser);
        const users = collection(db, 'chatAppUserData');
        getDocs(users)
            .then((QuerySnapshot) => {
                searchedUserList.current = QuerySnapshot.docs.map((doc) => doc.data()).filter((user) => user.name.toLowerCase().includes(searchUser.toLowerCase()));
            }).catch((error) => {
                console.log('Error Searching User: ', error);
            })
    }

    const groupParticipantsImgRef = useRef([]);
    const groupParticipantsRemoveImgRef = useRef([]);
    const chatRoomUserRef = useRef([]);
    const chatRoomSearchedUserRef = useRef([]);
    const chatGroupUserRef = useRef([]);
    const chatGroupSearchedUserRef = useRef([]);

    const [chooseChatRoom, setChooseChatRoom] = useState(true);

    const chooseChatRoomRef = useRef(null);
    const chooseChatGroupRef = useRef(null);

    return (
        <>
            {!userPhotoURL &&
                <Alert variant="filled" severity="success"> You are successfully signed in.</Alert>
            }
            {
                <>
                    <div id='main-page-navbar'>
                        <div id='main-page-logo-button'>
                            <img src="../chat-app-img.png" title="Chat App" alt="Chat App"></img>
                            <ButtonGroup variant="contained" color="secondary" aria-label="Basic button group">
                                <Button onClick={() => {
                                    setShowCreateChatRoom(true)
                                    setShowCreateChatGroup(false)
                                }}>Create Chat Room</Button>
                                <Button onClick={() => {
                                    setShowCreateChatGroup(true)
                                    setShowCreateChatRoom(false)
                                }}>Create Chat Group</Button>
                            </ButtonGroup>
                        </div>
                        <div id='main-page-profile'
                            onMouseEnter={() => { setShowProfileMenu(true) }}
                            onMouseLeave={() => { setShowProfileMenu(false) }}>
                            <img src={userPhotoURL} alt={userName} title={userName}
                                style={{ borderRadius: '50%', height: '60px', width: '60px' }}></img>

                            {showProfileMenu &&
                                <div id='main-page-profile-menu' >
                                    <div id='user-profile' style={{ fontFamily: 'roboto' }}>Profile</div>
                                    <div id='user-sign-out' style={{ fontFamily: 'roboto' }} onClick={() => { setSignOut(true) }}>Sign Out</div>
                                </div>
                            }

                        </div>
                    </div>
                </>
            }
            {showCreateChatRoom &&
                <>
                    <div id='create-chat-room-modal'>
                        <div id='create-chat-room-modal-heading-close'>
                            <h2 style={{ fontFamily: 'roboto' }}>Create Chat Room</h2>
                            <CloseIcon onClick={() => { setShowCreateChatRoom(false) }} style={{ cursor: 'pointer' }} fontSize="large"></CloseIcon>
                        </div>
                        <div id='create-chat-room-modal-search-user-list'>
                            <h3 style={{ fontFamily: 'roboto' }}>Choose a participant</h3>
                            <TextField variant="filled" label="Search" placeholder="Search...."
                                InputProps={{
                                    style: { color: 'white' }
                                }}

                                InputLabelProps={{
                                    style: { color: 'white' }
                                }}
                                fullWidth
                                value={searchChatRoomUser}
                                onChange={searchUser}
                            ></TextField>
                            <br></br>
                            <br></br>
                            {searchChatRoomUser.length === 0 &&
                                <div id='create-chat-room-modal-user-list'>
                                    {
                                        userList.current.map((user, index) => {
                                            if (user.email !== userEmailId) {
                                                return (
                                                    <div key={index} onClick={() => {
                                                        setParticipantPhotURL(user.photoURL);
                                                        setParticipantName(user.name)
                                                        setParticipantEmailId(user.email)
                                                    }}

                                                        onMouseEnter={() => {
                                                            chatRoomUserRef.current[index].style.boxShadow = "5px 5px 5px black"
                                                        }}

                                                        onMouseLeave={() => {
                                                            chatRoomUserRef.current[index].style.boxShadow = "none"
                                                        }}

                                                        onMouseDown={() => {
                                                            chatRoomUserRef.current[index].style.transform = "translate(5px,10px)"
                                                        }}

                                                        onMouseUp={() => {
                                                            chatRoomUserRef.current[index].style.transform = "translate(0px, 0px)"
                                                        }}


                                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', width: 'max-content' }}>
                                                        <img ref={el => chatRoomUserRef.current[index] = el} src={user.photoURL} alt={user.name} title={user.email} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                                        <p style={{ fontFamily: 'roboto' }}> {user.name}</p>
                                                    </div>
                                                )
                                            }
                                        })
                                    }
                                </div>
                            }
                            {searchChatRoomUser.length > 0 &&
                                <div id='create-chat-room-modal-searched-list'>
                                    {
                                        searchedUserList.current.map((user, index) => {

                                            if (user.email !== userEmailId) {
                                                return (
                                                    <div key={index} onClick={() => {
                                                        setParticipantPhotURL(user.photoURL);
                                                        setParticipantName(user.name)
                                                        setParticipantEmailId(user.email)
                                                    }}

                                                        onMouseEnter={() => {
                                                            chatRoomSearchedUserRef.current[index].style.boxShadow = "5px 5px 5px black"
                                                        }}

                                                        onMouseLeave={() => {
                                                            chatRoomSearchedUserRef.current[index].style.boxShadow = "none"
                                                        }}

                                                        onMouseDown={() => {
                                                            chatRoomSearchedUserRef.current[index].style.transform = "translate(5px,10px)"
                                                        }}

                                                        onMouseUp={() => {
                                                            chatRoomSearchedUserRef.current[index].style.transform = "translate(0px, 0px)"
                                                        }}

                                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', width: 'max-content' }}>
                                                        <img ref={el => chatRoomSearchedUserRef.current[index] = el} src={user.photoURL} alt={user.name} title={user.email} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                                        <p style={{ fontFamily: 'roboto' }}> {user.name}</p>
                                                    </div>
                                                )
                                            }
                                        })
                                    }
                                </div>
                            }
                        </div>
                        <div id='create-chat-room-modal-create-room'>
                            <h3 style={{ fontFamily: 'roboto' }}>Create Chat Room</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-around' }}>
                                <div>
                                    <h4 style={{ fontFamily: 'roboto' }}>You: </h4>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        <img src={userPhotoURL} alt={userName} title={userName} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                        <p style={{ fontFamily: 'roboto' }}> {userName}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ fontFamily: 'roboto' }}>Participant: </h4>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        <img src={participantPhotoURL} alt={participantName} title={participantName} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                        <p style={{ fontFamily: 'roboto' }}> {participantName}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <TextField focused variant="filled" label='Chat Room Name' placeholder="Enter Chat Room Name" type="text" value={chatRoomName} onChange={(event) => {
                                        const roomName = event.target.value;
                                        setChatRoomName(roomName)
                                    }}
                                        InputProps={{
                                            style: { color: 'white' }
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'white' }
                                        }}
                                    ></TextField>
                                    <br></br>
                                    <Button variant="outlined" onClick={createChatRoom}>Create Room</Button>
                                </div>
                            </div>
                        </div>
                        <br></br>
                    </div>
                </>
            }


            {showCreateChatGroup &&
                <>
                    <div id='create-chat-group-modal'>
                        <div id='create-chat-group-modal-heading-close'>
                            <h2 style={{ fontFamily: 'roboto' }}>Create Chat Group</h2>
                            <CloseIcon onClick={() => { setShowCreateChatGroup(false) }} style={{ cursor: 'pointer' }} fontSize="large"></CloseIcon>
                        </div>
                        <div id='create-chat-group-modal-search-user-list'>
                            <h3 style={{ fontFamily: 'roboto' }}>Choose participants</h3>
                            <TextField variant="filled" label="Search" placeholder="Search...."
                                InputProps={{
                                    style: { color: 'white' }
                                }}

                                InputLabelProps={{
                                    style: { color: 'white' }
                                }}
                                fullWidth
                                value={searchChatRoomUser}
                                onChange={searchUser}
                            ></TextField>
                            <br></br>
                            <br></br>
                            {searchChatRoomUser.length === 0 &&
                                <div id='create-chat-group-modal-user-list'>
                                    {
                                        userList.current.map((user, index) => {
                                            if (user.email !== userEmailId) {
                                                return (
                                                    <div key={index} onClick={() => {
                                                        setGroupAdd(user.email);
                                                        setGroupRemove('')
                                                        {
                                                            if (groupMemberRef.current.indexOf(userEmailId) === -1) {
                                                                groupMemberRef.current.push(userEmailId)
                                                            }
                                                            if (groupMemberRef.current.indexOf(user.email) === -1) {
                                                                groupMemberRef.current.push(user.email)
                                                            }
                                                        }
                                                    }}

                                                        onMouseEnter={() => {
                                                            chatGroupUserRef.current[index].style.boxShadow = "5px 5px 5px black"
                                                        }}

                                                        onMouseLeave={() => {
                                                            chatGroupUserRef.current[index].style.boxShadow = "none"
                                                        }}

                                                        onMouseDown={() => {
                                                            chatGroupUserRef.current[index].style.transform = "translate(5px,10px)"
                                                        }}

                                                        onMouseUp={() => {
                                                            chatGroupUserRef.current[index].style.transform = "translate(0px, 0px)"
                                                        }}

                                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', width: 'max-content' }}>
                                                        <img ref={el => chatGroupUserRef.current[index] = el} src={user.photoURL} alt={user.name} title={user.email} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                                        <p style={{ fontFamily: 'roboto' }}> {user.name}</p>
                                                    </div>
                                                )
                                            }
                                        })
                                    }
                                </div>
                            }
                            {searchChatRoomUser.length > 0 &&
                                <div id='create-chat-group-modal-searched-list'>
                                    {
                                        searchedUserList.current.map((user, index) => {

                                            if (user.email !== userEmailId) {
                                                return (
                                                    <div key={index} onClick={() => {
                                                        setGroupAdd(user.email);
                                                        setGroupRemove('')
                                                        {
                                                            if (groupMemberRef.current.indexOf(userEmailId) === -1) {
                                                                groupMemberRef.current.push(userEmailId)
                                                            }
                                                            if (groupMemberRef.current.indexOf(user.email) === -1) {
                                                                groupMemberRef.current.push(user.email)
                                                            }
                                                        }
                                                    }}

                                                        onMouseEnter={() => {
                                                            chatGroupSearchedUserRef.current[index].style.boxShadow = "5px 5px 5px black"
                                                        }}

                                                        onMouseLeave={() => {
                                                            chatGroupSearchedUserRef.current[index].style.boxShadow = "none"
                                                        }}

                                                        onMouseDown={() => {
                                                            chatGroupSearchedUserRef.current[index].style.transform = "translate(5px,10px)"
                                                        }}

                                                        onMouseUp={() => {
                                                            chatGroupSearchedUserRef.current[index].style.transform = "translate(0px, 0px)"
                                                        }}


                                                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', width: 'max-content' }}>
                                                        <img ref={el => chatGroupSearchedUserRef.current[index] = el} src={user.photoURL} alt={user.name} title={user.email} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                                        <p style={{ fontFamily: 'roboto' }}> {user.name}</p>
                                                    </div>
                                                )
                                            }
                                        })
                                    }
                                </div>
                            }
                        </div>

                        <div id='create-chat-group-modal-create-group'>
                            <h3 style={{ fontFamily: 'roboto' }}>Create Chat Group</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column' }}>
                                <div>
                                    <h4 style={{ fontFamily: 'roboto' }}>You: </h4>
                                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        <img src={userPhotoURL} alt={userName} title={userName} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                        <p style={{ fontFamily: 'roboto' }}> {userName}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ fontFamily: 'roboto' }}>Participants: </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-evenly' }}>
                                        {
                                            groupMember.map((user, index) => {
                                                if (user != null && user.email != userEmailId) {

                                                    return (
                                                        <div onClick={() => {
                                                            groupMemberRef.current = groupMemberRef.current.filter(member => member !== user.email)
                                                            setGroupRemove(user.email)
                                                            setGroupAdd('')
                                                        }
                                                        }
                                                            onMouseEnter={() => {
                                                                groupParticipantsImgRef.current[index].style.display = "none"
                                                                groupParticipantsRemoveImgRef.current[index].style.display = "inline"
                                                            }}
                                                            onMouseLeave={() => {
                                                                groupParticipantsImgRef.current[index].style.display = "inline"
                                                                groupParticipantsRemoveImgRef.current[index].style.display = "none"
                                                            }}
                                                            key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', width: 'max-content' }}>
                                                            <img ref={el => groupParticipantsImgRef.current[index] = el} src={user.photoURL} alt={user.name} title={user.name} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                                            <img ref={el => groupParticipantsRemoveImgRef.current[index] = el} src="https://freesvg.org/img/milker_X_icon.png" alt="Remove Participant" title="Remove Participant" style={{ display: 'none', borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                                            <p style={{ fontFamily: 'roboto' }}> {user.name}</p>
                                                        </div >
                                                    )
                                                }
                                            })
                                        }
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <TextField type="text" variant="filled" focused
                                        InputProps={{
                                            style: { color: 'white' }
                                        }}
                                        InputLabelProps={{
                                            style: { color: 'white' }
                                        }}
                                        label="Group Name"
                                        placeholder="Enter Group Name"
                                        value={groupName}
                                        onChange={(event) => {
                                            setGroupName(event.target.value)
                                        }}
                                    ></TextField>
                                    <br></br>
                                    <Button variant="outlined" onClick={createGroup} >Create Group</Button>
                                </div>
                            </div>
                        </div>
                        <br></br>
                    </div>
                </>
            }
            <div id='choose-chat-group-room'>
                <div id='choose-chat-room'
                    ref={chooseChatRoomRef}
                    onClick={() => {
                        setChooseChatRoom(true)
                        chooseChatRoomRef.current.style.borderBottom = '2px solid #00ff44'
                        chooseChatRoomRef.current.style.borderRight = '1px solid #00ff44'
                        chooseChatRoomRef.current.style.color = '#00ff44'
                        chooseChatRoomRef.current.style.fontWeight = '700'
                        chooseChatGroupRef.current.style.borderBottom = '2px solid white'
                        chooseChatGroupRef.current.style.borderLeft = '1px solid white'
                        chooseChatGroupRef.current.style.color = 'white'
                        chooseChatGroupRef.current.style.fontWeight = '500'
                    }}

                    onMouseEnter={() => {
                        chooseChatRoomRef.current.style.backgroundColor = 'rgb(150,150,150)'
                    }}
                    onMouseLeave={() => {
                        chooseChatRoomRef.current.style.backgroundColor = 'black'

                    }}

                >CHAT ROOMS</div>
                <div id='choose-chat-group'
                    ref={chooseChatGroupRef}
                    onClick={() => {
                        setChooseChatRoom(false)
                        chooseChatGroupRef.current.style.borderBottom = '2px solid #00ff44'
                        chooseChatGroupRef.current.style.borderLeft = '1px solid #00ff44'
                        chooseChatGroupRef.current.style.color = '#00ff44'
                        chooseChatGroupRef.current.style.fontWeight = '700'
                        chooseChatRoomRef.current.style.borderBottom = '2px solid white'
                        chooseChatRoomRef.current.style.borderRight = '1px solid white'
                        chooseChatRoomRef.current.style.color = 'white'
                        chooseChatRoomRef.current.style.fontWeight = '500'
                    }}
                    onMouseEnter={() => {
                        chooseChatGroupRef.current.style.backgroundColor = 'rgb(150,150,150)'
                    }}
                    onMouseLeave={() => {
                        chooseChatGroupRef.current.style.backgroundColor = 'black'

                    }}

                >CHAT GROUPS</div>
            </div>
            {
                <>
                    <div id='chat-room-group-message' >
                        {chooseChatRoom &&
                            <>
                                <div id='chat-room'>
                                    {
                                        chatRoomListState.map((item, index) => {
                                            if (userEmailId == item.member1 || userEmailId == item.member2) {
                                                if (userPhotoURL === item.photo1) {
                                                    return (
                                                        <div key={index} ref={el => roomRef.current[`${item.roomName}`] = el} onClick={() => {
                                                            setCurrentRoom(item.roomName)
                                                            setCurrentRoomPhoto(item.photo2)
                                                        }} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer', justifyContent: 'space-between', paddingLeft: '30px', paddingRight: '30px', borderBottom: '1px solid white', height: '100px' }}>
                                                            <img src={item.photo2} alt="Room Photo" style={{ borderRadius: '50%', height: '70px', width: '70px' }}></img>
                                                            <p style={{ fontFamily: 'roboto', fontSize: '20px' }}> {item.roomName}</p>
                                                        </div>)
                                                } else {
                                                    return (
                                                        <div key={index} ref={el => roomRef.current[`${item.roomName}`] = el} onClick={() => {
                                                            setCurrentRoom(item.roomName)
                                                            setCurrentRoomPhoto(item.photo1)
                                                        }} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer', justifyContent: 'space-between', paddingLeft: '30px', paddingRight: '30px', borderBottom: '1px solid white', height: '100px' }}>
                                                            <img src={item.photo1} alt="Room Photo" style={{ borderRadius: '50%', height: '70px', width: '70px' }}></img>
                                                            <p style={{ fontFamily: 'roboto', fontSize: '20px' }}> {item.roomName}</p>
                                                        </div>)
                                                }
                                            }
                                        })
                                    }
                                </div>
                                <div id='chat-room-msg'>
                                    {currentRoom !== '' &&
                                        <>
                                            <div id='chat-room-msg-header'>
                                                <img src={currentRoomPhoto} alt="Room Photo" style={{ borderRadius: '50%', height: '50px', width: '50px' }}></img>
                                                <p style={{ fontFamily: 'roboto', fontSize: '18px' }}> {currentRoom}</p>
                                            </div>
                                            <br></br>
                                            <div id='chat-room-msg-area'>
                                                <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px', marginRight: '10px' }}>
                                                    {
                                                        recieveMessage.map((msg, index) => {
                                                            if (msg.sender === userEmailId) {
                                                                return (
                                                                    <div key={index}>
                                                                        <p style={{ display: 'flex', justifyContent: 'flex-end', fontFamily: 'roboto', fontSize: '10px' }}>You</p>
                                                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                            <div id="chat-room-msg-area-sender" ref={messageAreaRef} >
                                                                                <p style={{ fontFamily: 'roboto', wordWrap: 'break-word' }}>{msg.message}</p>
                                                                            </div>
                                                                        </div>
                                                                        <p style={{ display: 'flex', justifyContent: 'flex-end', fontFamily: 'roboto', fontSize: '10px' }}>{msg.sentTime}</p>
                                                                        <br></br>
                                                                    </div>
                                                                )
                                                            } else if (msg.sender !== userEmailId) {
                                                                return (
                                                                    <div key={index}>
                                                                        <p style={{ display: 'flex', justifyContent: 'flex-start', fontFamily: 'roboto', fontSize: '10px' }}>{msg.senderName}</p>
                                                                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                                            <div id="chat-room-msg-area-receiver" ref={messageAreaRef}>
                                                                                <p style={{ fontFamily: 'roboto', wordWrap: 'break-word' }}>{msg.message}</p>
                                                                            </div>
                                                                        </div>
                                                                        <p style={{ display: 'flex', justifyContent: 'flex-start', fontFamily: 'roboto', fontSize: '10px' }}>{msg.sentTime}</p>
                                                                        <br></br>
                                                                    </div>
                                                                )
                                                            }
                                                        })
                                                    }
                                                </div>
                                            </div>
                                            <br></br>
                                            <div id='chat-room-msg-field'>
                                                <TextField variant="outlined" focused fullWidth label="Message" placeholder="Message" value={sentMessage} onChange={(event) => {
                                                    const newMessage = event.target.value;
                                                    setSentMessage(newMessage);
                                                }}
                                                    InputProps={{
                                                        style: { color: 'white' }
                                                    }}
                                                    InputLabelProps={{
                                                        style: { color: 'white' }
                                                    }}
                                                    onKeyDownCapture={(event) => {
                                                        if (event.key === 'Enter' && event.shiftKey === false) {
                                                            event.preventDefault();
                                                            setSentMessage('');
                                                            sendMessage();
                                                        }
                                                    }}
                                                    multiline
                                                ></TextField>
                                                <SendIcon onClick={sendMessage} style={{ cursor: 'pointer' }} fontSize="large" color="primary" ></SendIcon>
                                            </div>
                                        </>
                                    }
                                </div>
                            </>
                        }
                        {!chooseChatRoom &&
                            <>
                                <div id='chat-group'>
                                    {
                                        groupList.map((item, index) => {
                                            if (item !== null) {
                                                if (item.members.indexOf(`${userEmailId}`) !== -1) {
                                                    return (
                                                        <div key={index} ref={el => groupRef.current[`${item.groupName}`] = el} onClick={() => {
                                                            setCurrentGroup(item.groupName)
                                                        }} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer', justifyContent: 'space-between', paddingLeft: '30px', paddingRight: '30px', borderBottom: '1px solid white', height: '100px' }}>
                                                            <img src='https://icons.veryicon.com/png/o/miscellaneous/admin-dashboard-flat-multicolor/user-groups.png' alt="Group Photo" style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                                            <p style={{ fontFamily: 'roboto', fontSize: '20px' }}> {item.groupName}</p>
                                                        </div>
                                                    )
                                                }
                                            }
                                        })
                                    }
                                </div>
                                <div id='chat-group-msg'>
                                    {currentGroup !== '' &&
                                        <>
                                            <div id='chat-group-msg-header'>
                                                <img src='https://icons.veryicon.com/png/o/miscellaneous/admin-dashboard-flat-multicolor/user-groups.png' alt="Group Photo" style={{ borderRadius: '50%', height: '60px', width: '60px' }}></img>
                                                <p style={{ fontFamily: 'roboto', fontSize: '18px' }}> {currentGroup}</p>
                                            </div>
                                            <br></br>
                                            <div id='chat-group-msg-area'>
                                                <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px', marginRight: '10px' }}>
                                                    {
                                                        recieveGroupMessage.map((msg, index) => {
                                                            if (msg.sender === userEmailId) {
                                                                return (
                                                                    <div key={index}>
                                                                        <p style={{ display: 'flex', justifyContent: 'flex-end', fontFamily: 'roboto', fontSize: '10px' }}>You</p>
                                                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                            <div id="chat-group-msg-area-sender" ref={messageAreaRef} >
                                                                                <p style={{ fontFamily: 'roboto', wordWrap: 'break-word' }}>{msg.message}</p>
                                                                            </div>
                                                                        </div>
                                                                        <p style={{ display: 'flex', justifyContent: 'flex-end', fontFamily: 'roboto', fontSize: '10px' }}>{msg.sentTime}</p>

                                                                        <br></br>
                                                                    </div>
                                                                )
                                                            } else if (msg.sender !== userEmailId) {
                                                                return (
                                                                    <div key={index}>
                                                                        <p style={{ display: 'flex', justifyContent: 'flex-start', fontFamily: 'roboto', fontSize: '10px' }}>{msg.senderName}</p>
                                                                        <div key={index} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                                            <div id="chat-group-msg-area-receiver" ref={messageAreaRef}>
                                                                                <p style={{ fontFamily: 'roboto', wordWrap: 'break-word' }}>{msg.message}</p>
                                                                            </div>
                                                                        </div>
                                                                        <p style={{ display: 'flex', justifyContent: 'flex-start', fontFamily: 'roboto', fontSize: '10px' }}>{msg.sentTime}</p>
                                                                        <br></br>
                                                                    </div>
                                                                )
                                                            }
                                                        })
                                                    }
                                                </div>
                                            </div>
                                            <br></br>
                                            <div id='chat-group-msg-field'>
                                                <TextField variant="outlined" focused fullWidth label="Message" placeholder="Message" value={sentGroupMessage} onChange={(event) => {
                                                    const newGroupMessage = event.target.value;
                                                    setSentGroupMessage(newGroupMessage);
                                                }}
                                                    InputProps={{
                                                        style: { color: 'white' }
                                                    }}
                                                    InputLabelProps={{
                                                        style: { color: 'white' }
                                                    }}
                                                    onKeyDownCapture={(event) => {
                                                        if (event.key === 'Enter' && event.shiftKey === false) {
                                                            event.preventDefault();
                                                            setSentGroupMessage('');
                                                            sendGroupMessage();
                                                        }
                                                    }}
                                                    multiline
                                                ></TextField>
                                                <SendIcon onClick={sendGroupMessage} style={{ cursor: 'pointer' }} fontSize="large" color="primary" ></SendIcon>
                                            </div>
                                        </>
                                    }
                                </div>
                            </>
                        }
                    </div>
                </>
            }

            {signOut && <SignOut />}
        </>
    )
}

export default Welcome;



{/* <h1 style={{ fontFamily: 'roboto' }}>Welcome</h1>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <img src={userPhotoURL} alt={userName} title={userName} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                <p style={{ fontFamily: 'roboto' }}> {userEmailId}</p>
            </div>
            <h1 style={{ fontFamily: 'roboto' }}>User List</h1>
            {
                userList.current.map((user, index) => {
                    if (user.email !== userEmailId) {
                        return (
                            <div key={index} onClick={() => {
                                setParticipantPhotURL(user.photoURL);
                                setParticipantName(user.name)
                                setParticipantEmailId(user.email)
                                setGroupAdd(user.email);
                                setGroupRemove('')
                                {
                                    if (groupMemberRef.current.indexOf(userEmailId) === -1) {
                                        groupMemberRef.current.push(userEmailId)
                                    }
                                    if (groupMemberRef.current.indexOf(user.email) === -1) {
                                        groupMemberRef.current.push(user.email)
                                    }
                                }
                            }} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer', width: 'max-content' }}>
                                <img src={user.photoURL} alt={user.name} title={user.name} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                <p style={{ fontFamily: 'roboto' }}> {user.email}</p>
                            </div>
                        )
                    }
                })
            } */}


{/* {
            <h1 style={{ fontFamily: 'roboto' }}>Create Chat Room</h1>
            <h3 style={{ fontFamily: 'roboto' }}>You: </h3>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <img src={userPhotoURL} alt={userName} title={userName} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                <p style={{ fontFamily: 'roboto' }}> {userEmailId}</p>
            </div>
            <h3 style={{ fontFamily: 'roboto' }}>Choose a participant: </h3>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <img src={participantPhotoURL} alt={participantName} title={participantName} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                <p style={{ fontFamily: 'roboto' }}> {participantEmailId}</p>
            </div>
            <br></br>
            <br></br>
            <TextField focused variant="outlined" label='Chat Room Name' placeholder="Enter Chat Room Name" type="text" value={chatRoomName} onChange={(event) => {
                const roomName = event.target.value;
                setChatRoomName(roomName)
            }}
                InputProps={{
                    style: { color: 'white' }
                }}
                InputLabelProps={{
                    style: { color: 'white' }
                }}
            ></TextField>
            <br></br>
            <br></br>
            <Button variant="contained" onClick={createChatRoom}>Create Room</Button>

            } */}

{/* <h1 style={{ fontFamily: 'roboto' }}>Create Chat Group</h1>
            <h3 style={{ fontFamily: 'roboto' }}>You: </h3>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <img src={userPhotoURL} alt={userName} title={userName} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                <p style={{ fontFamily: 'roboto' }}> {userEmailId}</p>
            </div>
            <h3 style={{ fontFamily: 'roboto' }}>Add Members: </h3>

            {
                groupMember.map((user, index) => {
                    if (user != null && user.email != userEmailId) {

                        return (
                            <div onClick={() => {
                                groupMemberRef.current = groupMemberRef.current.filter(member => member !== user.email)
                                setGroupRemove(user.email)
                                setGroupAdd('')
                            }
                            } key={index} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer', width: 'max-content' }}>
                                <img src={user.photoURL} alt={user.name} title={user.name} style={{ borderRadius: '50%', height: '80px', width: '80px' }}></img>
                                <p style={{ fontFamily: 'roboto' }}> {user.email}</p>
                            </div >
                        )
                    }
                })
            }
            <br></br>
            <TextField type="text" variant="outlined" focused
                InputProps={{
                    style: { color: 'white' }
                }}
                InputLabelProps={{
                    style: { color: 'white' }
                }}
                label="Group Name"
                placeholder="Enter Group Name"
                value={groupName}
                onChange={(event) => {
                    setGroupName(event.target.value)
                }}
            ></TextField>
            <br></br>
            <br></br>
            <Button variant="contained" onClick={createGroup} >Create Group</Button> */}



{/* {
                <h1 style={{ fontFamily: 'roboto' }}>Chat Rooms</h1>
                {
                chatRoomListState.map((item, index) => {
                    if (userEmailId == item.member1 || userEmailId == item.member2) {
                        return (
                            <div key={index} ref={el => roomRef.current[`${item.roomName}`] = el} onClick={() => {
                                setCurrentRoom(item.roomName)
                            }} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer', width: 'max-content' }}>

                                <p style={{ fontFamily: 'roboto' }}> {item.roomName}</p>
                            </div>)
                        }
                    })
                }
            } */}


{/* <h1 style={{ fontFamily: 'roboto' }}> You are currently in : {currentRoom}</h1>

            {
                recieveMessage.map((msg, index) => {
                    if (msg.sender === userEmailId) {
                        return (
                            <div key={index}>
                                <p style={{ fontFamily: 'roboto' }}>You: {msg.message}</p>
                            </div>
                        )
                    } else {
                        return (
                            <div key={index}>
                            <p style={{ fontFamily: 'roboto' }}>{msg.senderName}: {msg.message}</p>
                            </div>
                            )
                        }
                    })
                } */}




{/* <TextField variant="outlined" focused label="Message" placeholder="Message" value={sentMessage} onChange={(event) => {
                const newMessage = event.target.value;
                setSentMessage(newMessage);
            }}
                InputProps={{
                    style: { color: 'white' }
                }}
                InputLabelProps={{
                    style: { color: 'white' }
                }}
            ></TextField>
            <br></br>
            <br></br>
        <Button variant="contained" onClick={sendMessage}>Send 🚀</Button> */}


{/* <h1 style={{ fontFamily: 'roboto' }}>Groups</h1>
            {
                groupList.map((item, index) => {
                    if (item !== null) {
                        if (item.members.indexOf(`${userEmailId}`) !== -1) {
                            return (
                                <div key={index} ref={el => groupRef.current[`${item.groupName}`] = el} onClick={() => {
                                    setCurrentGroup(item.groupName)
                                }} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer', width: 'max-content' }}>
                                    <p style={{ fontFamily: 'roboto' }}> {item.groupName}</p>
                                </div>
                            )
                        }
                    }
                })
            }


            <h1 style={{ fontFamily: 'roboto' }}> You are currently in : {currentGroup}</h1>

            {
                recieveGroupMessage.map((msg, index) => {
                    if (msg.sender === userEmailId) {
                        return (
                            <div key={index}>
                                <p style={{ fontFamily: 'roboto' }}>You: {msg.message}</p>
                            </div>
                        )
                    } else {
                        return (
                            <div key={index}>
                                <p style={{ fontFamily: 'roboto' }}>{msg.senderName}: {msg.message}</p>
                            </div>
                        )
                    }
                })
            }


            <TextField variant="outlined" focused label="Message" placeholder="Message" value={sentGroupMessage} onChange={(event) => {
                const newGroupMessage = event.target.value;
                setSentGroupMessage(newGroupMessage);
            }}
                InputProps={{
                    style: { color: 'white' }
                }}
                InputLabelProps={{
                    style: { color: 'white' }
                }}
            ></TextField>
            <br></br>
            <br></br>
            <Button variant="contained" onClick={sendGroupMessage}>Send 🚀</Button> */}