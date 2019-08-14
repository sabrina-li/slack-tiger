import React from "react";
import manipulateText from "../utils/helper"


class Replies extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            haveNewReply: false,
            newReply: {}
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    handleChange(event) {
        this.setState({ value: event.target.value });
    }
    handleSubmit(event, ts) {
        event.preventDefault();
        this.setState({ haveNewReply: false });
        this.postToThread(this.state.value, ts);
    }

    postToThread(message, ts) {
        //TODO: Check for logged in the user? or browser handles it
        const body = {
            message: message,
            thread_ts: ts
        }
        fetch("/api/reply", {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow', // manual, *follow, error
            body: JSON.stringify(body), // body data type must match "Content-Type" header
        }).then(response => response.json())
            .then(data => {
                console.log("data",data)
                if (data) {
                    this.setState({
                        haveNewReply: true
                        , newReply:  data
                        // {
                        //     bot_id: data.message.bot_id,
                        //     parent_user_id: data.message.parent_user_id,
                        //     text: data.message.text,
                        //     thread_ts: data.message.thread_ts,
                        //     ts: data.message.ts,
                        //     type: data.message.type,
                        //     user: data.message.user
                        // }
                        , value: ''
                    })
                }
            })
            .catch(console.error);//TODO: display error
    }

    render() {
        // console.log(replies)
        // if (this.state.haveNewReply) {
        //     replies = this.props.replies.concat(this.state.newReply);
        // }
        const repliesDiv = this.props.replies.map(reply => {
            return <p key={reply.ts} className="replies">
                <strong>{reply.username ? reply.username : reply.userInfo.real_name}:</strong>
                <br></br>
                <span dangerouslySetInnerHTML={{ __html: manipulateText(reply.text) }}></span>
                </p>
        })
        return <div className="collapsible-body">
            <span>
                {repliesDiv}
                {
                    this.state.haveNewReply?
                    <p key={this.state.newReply.ts} className="replies">
                        <strong>{this.state.newReply.username ? this.state.newReply.username : this.state.newReply.userInfo.real_name}:</strong>
                        <br></br>
                        <span dangerouslySetInnerHTML={{ __html: manipulateText(this.state.newReply.text) }}></span>
                    </p>:''
                }
            <form data={this.props.ts}>
                    <textarea className="reply-message" value={this.state.value} onChange={this.handleChange} type="text" name="reply"></textarea>
                    <br></br>
                    <input data={this.props.ts} className="submit" type="submit" value="Submit" onClick={e => this.handleSubmit(e, this.props.ts)}></input>
                </form>
                {/* <button data={postText.thread_ts} className="reply-btn">Reply</button>  */}

        </span>
        </div>
    }
}

export default Replies;