import React from "react";
import manipulateText from "../utils/helper"

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.message = this.props.message;
    this.handler = this.props.handler;
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

    const maintext = this.message.message_preview.split('-')
    return <li key={this.message.id}>
            <div className="card-header" data={maintext[1].trim()}>
                <span>
                    <strong>{maintext[1]} - {maintext[0]} - {this.message.userInfo?this.message.userInfo.real_name:this.message.user}</strong>
                    <a href={this.message.thread_link}> Open in Slack</a>
                    <br></br>
                    <p data-ticket={maintext[1].trim()} onClick={e => this.handler(e,maintext[1].trim())} dangerouslySetInnerHTML={{ __html: manipulateText(maintext.slice(2).join('-')) }}></p>
                    <p>{reactions}</p>
                </span>
            </div>
            </li>
    }
}

export default Card;