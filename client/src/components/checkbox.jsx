import React from "react";

class Checkbox extends React.Component {
    constructor (props){
        super(props);
        this.tag = props.tag;
        this.handler = props.handler
    // const selectedTags = this.state.selectedTags
    // const idx = selectedTags.indexOf(tag);
    }
    render(){
        return (<p>
            <label>
                <input type="checkbox" className= "checkbox" id={this.tag} onClick={(e) => this.handler(this.tag,e)} />
                <span>{this.tag}</span>
            </label>
          </p>)
    }
  }

  export default Checkbox;