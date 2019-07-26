const manipulateText = (t)=>{
    const tArr = t.split("<http");
    for(var j=1;j<tArr.length;j++){
        tArr[j-1] = tArr[j-1]+"<a href=\"http";

        tArr[j]=tArr[j].replace(/>/,"\">http"+tArr[j].replace(/>/,"</a>"));
    }
    t = tArr.join('');
    t = t.replace(/\n/g, "<br/>");
    return t;
}

export default manipulateText;