import React from 'react'
import Message from './Message'

const Messages = ({ messages, selectToggle, starToggle }) => {
  const messageComponents = messages.map(message => (
    <Message
      key={message.id}
      message={message}
      selectToggle={selectToggle}
      starToggle={starToggle}
      />
  ))

  return (
    <div>
      {messageComponents}
    </div>
  )
}

export default Messages
