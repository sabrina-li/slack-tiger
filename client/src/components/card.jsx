import React from "react";
import manipulateText from "../utils/helper"
import timeago from 'epoch-timeago';

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.message = this.props.message;
    this.handler = this.props.handler||console.log;
  }

  render(){
    //TODO:add reactions
    let reactions = [];
    // const reactionsArr = thread.reactions ? thread.reactions : [];
    // if (reactionsArr.length > 0){
    //     reactionsArr.forEach(val=>{
    //         reactions.push(val.name);
    //     })
    // }
    const timeDiff = timeago((this.message.message_ts || this.message.ts) * 1000);
    const maintext = this.message.message_preview.split('-')
    return <li key={this.message.id}>
            <div className="card-header" data={maintext[1].trim()}>
                <span>
                    <strong>{maintext[1]} - {maintext[0]} - {this.message.userInfo?this.message.userInfo.real_name:this.message.user}</strong>
                    <a href={this.message.thread_link}> Open in Slack</a>
                    <br></br>
                    <span className="time-tag">{timeDiff} {/* Date(parseInt(this.message.message_ts))*/}</span>
                    <p data-ticket={maintext[1].trim()} onClick={e => this.handler(e,maintext[1].trim())} dangerouslySetInnerHTML={{ __html: manipulateText(maintext.join('-')) }}></p>
                    <p>{reactions}</p>
                </span>
            </div>
            </li>
    }
}

export default Card;