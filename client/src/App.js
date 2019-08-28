import React from 'react';
import Checkbox from "./components/checkbox.jsx"
import Card from "./components/card.jsx"
import CardStream from "./components/cardStream.jsx"
import axios from 'axios';
import './App.scss'

import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:3001');//TODO: use env variable here

class App extends React.Component {
  constructor(props) {
    super(props);
    socket.on('message', (newMessage) => {
      if (this.state.selectedTags.indexOf(newMessage.tags) !== -1) {
        this.setState(prevState => {
          return { 
            message: prevState.messages.unshift(newMessage),
            newMessages: prevState.newMessages.push(newMessage.id)
          };
        })
      }
    });

    this.state = {
      showTags: false,//TODO:use hamberger menu
      tags: [],
      selectedTags: [],
      messages: [],
      viewTicket: false,
      ticketThreads: [],
      ticketID: '',
      newMessages:[]
    };
    this.handleTagSelection = this.handleTagSelection.bind(this);
  }


  handleTagSelection(id, e) {
    const selectedTags = Array(...this.state.selectedTags);
    const idx = selectedTags.indexOf(id);
    if (idx === -1) {
      selectedTags.push(id);
    } else {
      selectedTags.splice(idx, 1);
    }
    this.setState(state => ({
      viewTicket: false,
      selectedTags: selectedTags,
      messages: []
    }));

    //fetch messages
    axios("/api/posts?tags=" + selectedTags + "&from=1522962323.00000")
      .then((res) => {
        res.data.sort((a, b) => { return Number(b.ts) - Number(a.ts) });
        console.log(res.data)
        this.setState(state => ({
          messages: res.data
        }));
      }).catch(error => {
        console.error(error);
      });
  }

  goToTicket = (e, ticketID,messageID) => {
    this.setState(prevState=>
      {
        return {
          loading: true,
          newMessages:prevState.newMessages.filter(id=>messageID!==id)
        }
    })
    axios("/api/ticket/" + ticketID)
      .then(res => {
        if (res.data && res.data[0]) {
          this.setState({
            ticketThreads: res.data,
            viewTicket: true,
            loading: false
          })
        } else {
          alert("ticket not found in our DB... Please confirm the ticket is correct! If it is our fault, we will improve this soon!")
          this.setState({
            messageCards: null,
            viewTicket: true,
            loading: false
          })
        }
      }).catch(error => {
        console.error(error);
      });
  }

  handleChange = event => {
    this.setState({ ticketID: event.target.value });
  }

  handleSubmit = event => {
    event.preventDefault();
    this.goToTicket(event, this.state.ticketID)
  }

  goBack = event => {
    event.preventDefault();
    this.setState({ viewTicket: false })
  }

  render() {
    if (this.state.tags && this.state.tags.length === 0) {
      //fetch tags from server
      axios('/api/tags')
        .then((res) => {
          this.setState({ tags: res.data.tags })
        })
        .catch(console.log)
      return <div className="loader"></div>;
    } else {
      const tagsCheckboxes = this.state.tags.map(val => {
        return <Checkbox tag={val} key={val} handler={this.handleTagSelection} />
      });
      // let messageCards;
      // if(this.state.newMessage){
      //   console.log(messageCards);
      //   messageCards.unshift(<Card message={this.state.newMessage} handler={this.goToTicket} key={this.state.newMessage.id}/>)
      // }
      return (<main className="container">
        {this.state.loading ? <div className="loader"></div> : ''}
        <h4>Slack View</h4>
        <div className="row">
          <form onSubmit={this.handleSubmit}>
            <label>
              Ticket No.:
            </label>
            <input type="text" value={this.state.ticketID} onChange={this.handleChange} />
            <input type="submit" value="Submit" />
          </form>
        </div>

        <div className="row">
          {/* TODO:reload with tags when clicked on goback */}
          {this.state.viewTicket ? <button onClick={this.goBack}><i className="fas fa-arrow-left"></i></button> : null}

          <div className="col s3 card-panel ">
            <form id="tagsCheckList" action="#">
              {tagsCheckboxes}
            </form>
          </div>
          <div className="col s9 card-panel" >
            <ul id="posts-panel" >
              {/* {messageCards} */}

              {
                this.state.viewTicket ?
                  <CardStream ticketThreads={this.state.ticketThreads} /> :
                  this.state.messages.map(message => {
                    const isNew = this.state.newMessages.indexOf(message.id)!==-1
                    return <Card message={message} onClick={this.goToTicket} key={message.id} id={message.id} new={isNew}/>;
                  })
              }

            </ul>
          </div>
        </div>
      </main>)
    }
  }
}

export default App;