import { useState, useEffect } from 'react';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { database } from '../../../firebase/config';

export const useChat = (gameId, user) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!gameId) return;

    const chatRef = ref(database, `games/${gameId}/chat`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesArray = Object.entries(data).map(([id, message]) => ({
          id,
          ...message,
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        setChatMessages(messagesArray);
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !gameId) return;

    const chatRef = ref(database, `games/${gameId}/chat`);
    push(chatRef, {
      text: newMessage.trim(),
      sender: user.uid,
      senderName: user.displayName || user.email,
      timestamp: serverTimestamp(),
    });

    setNewMessage('');
  };

  return {
    chatMessages,
    newMessage,
    setNewMessage,
    sendMessage
  };
}; 