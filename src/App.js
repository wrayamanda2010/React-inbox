import React, { Component } from 'react';
import Toolbar from './components/Toolbar'
import Messages from './components/Messages'
import ComposeMessage from './components/ComposeMessage'
import './App.css';

class App extends Component {

  constructor(props) {
    super(props)
    this.state = { messages: [] }
  }

  async componentDidMount() {
    const response = await this.request(`/api/messages`)
    const json = await response.json()
    this.setState({messages: json._embedded.messages})
  }

  async request(path, method = 'GET', body = null) {
   if (body) body = JSON.stringify(body)
   return await fetch(`${process.env.REACT_APP_API_URL}${path}`, {
     method: method,
     headers: {
       'Content-Type': 'application/json',
       'Accept': 'application/json',
     },
     body: body
   })
 }

  propertyToggle(message, property) {
    const index = this.state.messages.indexOf(message)
    this.setState({
      messages: [
        ...this.state.messages.slice(0, index),
        { ...message, [property]: !message[property] },
        ...this.state.messages.slice(index + 1),
      ]
    })
  }

  async selectToggle(message) {
    this.propertyToggle(message, 'selected')
  }

  async updateMessages(payload) {
    await this.request('/api/messages', 'PATCH', payload)
  }

  async starToggle(message) {
    await this.updateMessages({
      "messageIds": [ message.id ],
      "command": "star",
      "star": message.starred
    })

    this.toggleProperty(message, 'starred')
  }

  async markAsRead() {
      await this.updateMessages({
        "messageIds": this.state.messages.filter(message => message.selected).map(message => message.id),
        "command": "read",
        "read": true
      })
      this.setState({
        messages: this.state.messages.map(message => (
          message.selected ? { ...message, read: true } : message
        ))
      })
    }

  async markAsUnread() {
    await this.updateMessages({
      "messageIds": this.state.messages.filter(message => message.selected).map(message => message.id),
      "command": "read",
      "read": false
    })
    this.setState({
      messages: this.state.messages.map(message => (
        message.selected ? { ...message, read: false } : message
      ))
    })
  }

   async deleteMessages() {
    await this.updateMessages({
      "messageIds": this.state.messages.filter(message => message.selected).map(message => message.id),
      "command": "delete"
    })

    const messages = this.state.messages.filter(message => !message.selected)
    this.setState({ messages })
  }

  selectAll() {
    const selectedMessages = this.state.messages.filter(message => message.selected)
    const selected = selectedMessages.length !== this.state.messages.length
    this.setState({
      messages: this.state.messages.map(message => (
        message.selected !== selected ? { ...message, selected } : message
      ))
    })
  }

  compose() {
    this.setState({composing: !this.state.composing})
  }

  async applyLabel(label) {
    await this.updateMessages({
      "messageIds": this.state.messages.filter(message => message.selected).map(message => message.id),
      "command": "addLabel",
      "label": label
    })

    const messages = this.state.messages.map(message => (
      message.selected && !message.labels.includes(label) ?
        { ...message, labels: [...message.labels, label].sort() } :
        message
    ))
    this.setState({ messages })
  }

  async removeLabel(label) {
    await this.updateMessages({
      "messageIds": this.state.messages.filter(message => message.selected).map(message => message.id),
      "command": "removeLabel",
      "label": label
    })

    const messages = this.state.messages.map(message => {
      const index = message.labels.indexOf(label)
      if (message.selected && index > -1) {
        return {
          ...message,
          labels: [
            ...message.labels.slice(0, index),
            ...message.labels.slice(index + 1)
          ]
        }
      }
      return message
    })
    this.setState({ messages })
  }

  async sendMessage(message) {
    const response = await this.request('/api/messages', 'POST', {
      subject: message.subject,
      body: message.body,
    })
    const newMessage = await response.json()

    const messages = [...this.state.messages, newMessage]
    this.setState({
      messages,
      composing: false,
    })
  }

  render() {
    return (
      <div>
        <div className="navbar navbar-default" role="navigation">
          <div className="container">
            <div className="navbar-header">
              <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target=".navbar-collapse">
                <span className="sr-only">Toggle navigation</span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
              </button>
              <a className="navbar-brand" href="/">React Inbox</a>
            </div>
          </div>
        </div>

        <div className="container">
          <Toolbar
            messages={this.state.messages}
            markAsRead={this.markAsRead.bind(this)}
            markAsUnread={this.markAsUnread.bind(this)}
            deleteMessages={this.deleteMessages.bind(this)}
            selectAll={this.selectAll.bind(this)}
            compose={this.compose.bind(this)}
            applyLabel={this.applyLabel.bind(this)}
            removeLabel={this.removeLabel.bind(this)}
          />

          {
            this.state.composing ?
              <ComposeMessage sendMessage={ this.sendMessage.bind(this) } /> :
              null
          }

          <Messages
            messages={this.state.messages}
            selectToggle={this.selectToggle.bind(this)}
            starToggle={this.starToggle.bind(this)}
          />
        </div>
      </div>
    );
  }
}

export default App;
