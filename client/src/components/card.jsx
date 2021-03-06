import React from "react";
import manipulateText from "../utils/helper"
import timeago from 'epoch-timeago';

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.message = this.props.message;
    this.handler = this.props.handler||console.log;
    this.state={timeDiff:timeago((this.message.message_ts || this.message.ts) * 1000)}
  }


  componentDidMount(){
    //update the time display every minute
    
    this.timer = setInterval(() => {
      const timeDiff = timeago((this.message.message_ts || this.message.ts) * 1000);
      this.setState({
        timeDiff
      })
    }, 1000*60);
    console.log("set",this.timer);
  }

  componentWillUnmount(){
    console.log("clear",this.timer);
    clearInterval(this.timer);
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
    return <li key={this.message.id} className={this.props.new?"new-message":null}>
            <div className="card-header" data={maintext[1].trim()}>
                <span>
                  <div className="card-title">
                    <span><strong>{maintext[1]} - {maintext[0]} - {this.message.userInfo?this.message.userInfo.real_name:this.message.user}</strong></span>
                    <a href={this.message.thread_link}> Open in Slack</a>
                  </div>
                    <span className="time-tag">{this.state.timeDiff} {/* Date(parseInt(this.message.message_ts))*/}</span>
                    <p data-ticket={maintext[1].trim()} onClick={e => this.props.onClick(e,maintext[1].trim(),this.props.id)} dangerouslySetInnerHTML={{ __html: manipulateText(maintext.join('-')) }}></p>
                    <p>{reactions}</p>
                </span>
            </div>
            </li>
    }
}

export default Card;