import './App.css';

import {useEffect, useState} from 'react'
import { ChatProvider } from './context/ChatContext'
import Container from './components/Container';


function App() {



  return (
    <ChatProvider>
      <Container />
    </ChatProvider>
  );
}

export default App;
