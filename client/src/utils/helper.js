const manipulateText =  (t)=>{
    const tArr = t.split("<http");
    for(var i=1;i<tArr.length;i++){
        tArr[i-1] = tArr[i-1]+"<a href=\"http";

        tArr[i]=tArr[i].replace(/>/,"\">http"+tArr[i].replace(/>/,"</a>"));
    }
    t = tArr.join('');
    t = t.replace(/\n/g, "<br/>");
    return t;
}

export default manipulateText;