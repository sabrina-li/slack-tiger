import React from "react";
import Card from "./card.jsx"

import Replies from "./replies.jsx";


class CardStream extends React.Component {
  // constructor(props){
  //   super(props);
  //   // this.state = {
  //   //   value: '',
  //   //   haveNewReply:false,
  //   //   newReply:{}
  //   // };
  //   // this.handleChange = this.handleChange.bind(this);
  //   // this.handleSubmit = this.handleSubmit.bind(this);
  // }

    render(){
      
      //ticketThreads is array of all threads
      //each thread is an array of message/replies
        const allThreadsTicketCards = this.props.ticketThreads.map(thread=>{
          let reactions = [];//TODO add reactions for each thread

          const postText=thread[0];
          postText.message_preview = postText.text;
          let replies = thread.slice(1);
          
          return <div key={postText.ts}>
                    <Card  message={postText} />
                    <Replies replies={replies} ts={postText.ts}/>
                  </div>
        });
        return allThreadsTicketCards;
      }

}

export default CardStream;