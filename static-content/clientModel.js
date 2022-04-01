class Stage {
	constructor(canvas, size, hash){//stage for client side game state with update and draw function
		this.canvas = canvas;
	
		this.actors=[]; // all actors on this stage (monsters, player, boxes, ...)
        this.player=null; // a special actor, the player
        this.width=size; //for world size
		this.height=size;
        this.hash = hash; //for identification of player
		this.canvasWidth=canvas.width;
		this.canvasHeight=canvas.height;
    }
    setPlayer(){ //set the player from the list of actors
		for(let i=0;i<this.actors.length;i++){
			if(this.actors[i].hash && this.actors[i].hash==this.hash){
                // console.log("checking", this.actors[i].hash, this.hash);
                this.player = this.actors[i];
                return;
			}
		}
	}
    init(data){//set the stage objects from game model
        if(data == null){
            return;
        }
        this.actors = data;
        this.setPlayer(); 
    }
    update(data){//update the model's changes
        if(data == null){
            return;
        }
        this.updateActors(data);
        this.setPlayer();
    }
    updateActors(data){
        for(let i=0;i<data.length;i++){
            this.actors[data[i].index] = data[i].actor; 
        }
		this.actors = this.actors.filter(actor => !actor.isZombie);
    }
    draw(){
        if(!this.player || this.player.isZombie) return;
        var context = this.canvas.getContext('2d');
		let playerPosition = this.player.position;
		let x=playerPosition.x;
		let y=playerPosition.y;
		let xt=-x+this.canvasWidth/2;
		let yt=-y+this.canvasHeight/2;
		context.resetTransform();

		context.fillStyle = '#6f6';
		context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

		context.translate(xt,yt);
        context.fillRect(0, 0, this.width, this.height);
        this.drawActors(context);
    }
    drawActors(context){
        for(var i=0;i<this.actors.length;i++){
            if(this.actors[i].isZombie) continue; //incase they exist
            switch(this.actors[i].type){
                case 'box':
                    this.drawBox(context, i);
                    break;
                case 'ball':
                    this.drawBall(context, i);
                    break;
                case 'player':
                    this.drawPlayer(context, i);
                case 'bullet':
                   this.drawBullet(context, i);
                   break;
                default:
                    console.log("can't draw");
            }
		}
    }
    drawBall(context, i){
        var ball = this.actors[i];
        context.fillStyle = ball.colour;
		context.beginPath(); 
		var intPosition = ball.position;
		context.arc(intPosition.x, intPosition.y, ball.radius, 0, 2 * Math.PI, false); 
		context.fill();   
    }
    drawBox(context, i){
        var box = this.actors[i];
        var intPosition = box.position;
		var x=intPosition.x-box.radius;
		var y=intPosition.y-box.radius; 
		var width = box.radius*2; 
		context.fillStyle = box.colour;
		context.fillRect(x,y,width,width); 
		context.strokeStyle="x000";
		context.strokeRect(x,y,width,width);
    }
    drawPlayer(context, i){
        var player = this.actors[i];
        context.fillStyle = player.colour;
		context.beginPath(); 
		var intPosition = player.position;
		context.arc(intPosition.x, intPosition.y, player.radius, 0, 2 * Math.PI, false); 
		context.fill();
        //context.arc(intPosition.x, intPosition.y, player.radius, 0, 2 * Math.PI, false); 
		context.stroke();   

		var turretPos =  this.actors[i].turretPos;
		context.beginPath(); 
		context.arc(turretPos.x, turretPos.y, player.radius/2, 0, 2 * Math.PI, false); 
		context.fill();
        //context.arc(turretPos.x, turretPos.y, player.radius/2, 0, 2 * Math.PI, false); 
		context.stroke();  
        
        context.beginPath();
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(this.actors[i].hash, intPosition.x, intPosition.y - 15);
        context.fill();
    }
    drawBullet(context, i){
        var ball = this.actors[i];
        context.fillStyle = ball.colour;
		context.beginPath(); 
		var intPosition = ball.position;
		context.arc(intPosition.x, intPosition.y, ball.radius, 0, 2 * Math.PI, false); 
		context.fill();   
    }
}