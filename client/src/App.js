import React from 'react';
import Checkbox from "./components/checkbox.jsx"
import Card from "./components/card.jsx"
import CardStream from "./components/cardStream.jsx"
import axios from 'axios';
import './App.scss'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showTags: false,//TODO:use hamberger menu
      tags: [],
      selectedTags: [],
      messages: [],
      viewTicket: false,
      ticketThreads: [],
      ticketID:''
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
        this.setState(state => ({
          messages: res.data
        }));
      }).catch(error => {
        console.error(error);
      });
  }

  goToTicket = (e, ticketID) => {
    this.setState({
      loading:true
    })
    axios("/api/ticket/" + ticketID)
      .then(res => {
        if (res.data && res.data[0]) {
          this.setState({
            ticketThreads: res.data,
            viewTicket: true,
            loading:false
          })
        } else {
          alert("ticket not found in our DB... Please confirm the ticket is correct! If it is our fault, we will improve this soon!")
          this.setState({
            messageCards: null,
            viewTicket: true,
            loading:false
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
    this.goToTicket(event,this.state.ticketID)
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
      let messageCards;
      if (this.state.viewTicket) {
        //TODO: fetch and show the ticket with all threads related to the ticket
        messageCards = <CardStream ticketThreads={this.state.ticketThreads} />
      } else {
        messageCards = this.state.messages.map(message => {
          return <Card message={message} handler={this.goToTicket} key={message.id}/>;
        })
      }
      return (<main className="container">
        {this.state.loading?<div className="loader"></div>:''}
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
          {/* {this.state.viewTicket ? <button><i className="fas fa-arrow-left"></i></button> : null} */}
          
          <div className="col s3 card-panel ">
            <form id="tagsCheckList" action="#">
              {tagsCheckboxes}
            </form>
          </div>
          <div className="col s9 card-panel" >
            <ul id="posts-panel" >
              {messageCards}
            </ul>
          </div>
        </div>
      </main>)
    }
  }
}

export default App;