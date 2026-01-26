import app from './app.js'

app.get('/', function(req, res){
    res.json({status: "Running..."})
})
app.get('/health', function(req, res){
    res.json({status: "OK"})
})

app.post('/echo', function(req, res){
    
    if(Object.keys(req.body).length>0){
        res.json({received: req.body})
    }
    else{
        res.json({received: "No body"})
    }
})

app.listen(3003,()=>{
    console.log("Server running on PORT 3003")
})