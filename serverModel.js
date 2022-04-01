function randint(n){ return Math.round(Math.random()*n); }
function rand(n){ return Math.random()*n; }

class Stage {//a2 model without draw and added methods to send data to clients
	constructor(size){
        this.changed = false;
		this.actors=[]; // all actors on this stage (monsters, player, boxes, ...)
		this.width=size;
		this.height=size;

		let numBoxes= size/30;

		// Lots of boxes
		for(let i=0;i<numBoxes;i++){
			let s = this.randomState();
			var b = new Box(this, s.position, s.colour,40);
			this.addActor(b);
		}
    }
    initAll(ws){
       if(this.getPlayer(ws) ==  null) 	
			this.initPlayer(ws);
        return {'init' : this.getActors(), 'size':this.height};        
    }
    getActors(){
        var actors = [];
        //get actors
        for(let i=0;i<this.actors.length;i++){
                actors.push(this.actors[i].getAttr());  
        }
        return actors;
	}
	getUpdatedActors(){
        var actors = [];
        for(let i=0;i<this.actors.length;i++){
            if(this.actors[i].changed)
				actors.push({'index':i, 'actor':this.actors[i].getAttr()});  
			this.actors[i].changed =false;
		}
		// Remove zombies
		this.actors = this.actors.filter(actor => !actor.isZombie);
        // console.log(actors);
        return actors;
	}
	
    initPlayer(ws){
        var s = this.randomState();
        var player = new Tank(this, s.position, new Pair(0,0), s.colour, s.radius, ws);
        player.amunition = 10;
        this.addActor(player);
        return player;
    }
    updatePlayer(ws, data){
        var player = this.getPlayer(ws);
		// console.log(player, ws);
		if(player ==  null)
			return;
		
        if(data.moveMap)
            player.setDirection(data.moveMap.dx, data.moveMap.dy)
        else if(data.pickup)
            player.setPickup(data.pickup);
        else if(data.mousePos)
            player.mouseMove(data.mousePos.x, data.mousePos.y);
        else if(data.mouseClick){
            player.mouseClick(data.mouseClick.x, data.mouseClick.y);
        }else if (data.canvasWidth){
            player.setCanvas(data);
        }else{
            console.log("update err", data);
        }
        player.changed = true;
        // this.changed.push(player);
    }
	randomState(){
		var red=randint(255), green=randint(255), blue=randint(255), alpha = Math.random();
		var x=Math.floor((Math.random()*this.width)),
			y=Math.floor((Math.random()*this.height));
	
		return {
			radius : randint(20),
			colour: 'rgba('+red+','+green+','+blue+','+alpha+')',
			position : new Pair(x,y),
			velocity : new Pair(rand(20), rand(20)),
		}
    }
    getPlayer(hash){
		for(var i=0;i<this.actors.length;i++){
			if(this.actors[i].ws && this.actors[i].ws==hash){
				return this.actors[i];
			}
		}
		return null;
	}
	addActor(actor){
		this.actors.push(actor);
    }
	// Take one step in the animation of the game.  
	// Do this by asking each of the actors to take a single step. 
	step(){
		for(var i=0;i<this.actors.length;i++){
			this.actors[i].step();
		}
	}

	// return the first actor at coordinates (x,y) return null if there is no such actor
	getActor(x, y){
		for(var i=0;i<this.actors.length;i++){
			if(this.actors[i].x==x && this.actors[i].y==y){
				return this.actors[i];
			}
		}
		return null;
	}
} // End Class Stage

class Pair {
	constructor(x,y){ this.x=x; this.y=y; }
	toString(){ return "("+this.x+","+this.y+")"; }
	norm2(){ return Math.sqrt(this.x*this.x+this.y*this.y); }
	normalize(){ return this.sProd(1.0/this.norm2()); }
	toInt(){ return new Pair(Math.round(this.x), Math.round(this.y)); }
	clone(){ return new Pair(this.x, this.y); }
	sProd(z){ return new Pair(this.x*z, this.y*z); }
	dotProd(other){ return new Pair(this.x*other.x, this.y*other.y); }
	vecAdd(other){ return new Pair(this.x+other.x, this.y+other.y); }
	vecSub(other){ return new Pair(this.x-other.x, this.y-other.y); }
}
class Actor {
	constructor(stage, position, velocity, colour, radius){
		this.stage = stage;
		this.changed = true;
		// Below is the state of this
		this.position=position;
		this.velocity=velocity;
		this.colour = colour;
		this.radius = radius;
		this.isZombie = false;
		this.health = 10;

		this.stateVars = [ "position" , "velocity", "colour", "radius", "isZombie", "health" ]; // should be static
		this.savedState = {};
	}
	saveState(){
		this.savedState={};
		for(var s in this.stateVars){
			this.savedState[this.stateVars[s]]= this[this.stateVars[s]];
		}
	}
	makeZombie(){ this.changed = true;this.isZombie = true; }

	collide(other){ 
		// Stop us moving when we collide with someone else
		this.position = this.savedState.position;
		this.velocity = new Pair(0,0);
	}

	// Return a list of actors close this
	getCloseActors(delta){
		var closeActors = [];
 		for(var i in this.stage.actors){
			var other = this.stage.actors[i];
			if(other==this)continue;
			var distanceBetween = this.position.vecSub(other.position).norm2();
			if(distanceBetween<=(this.radius+other.radius+delta)){
				closeActors.push(other);
			}
		}
		return closeActors;
	}

	step(){
		// Save our previous state, just in case
		this.saveState(); 
		this.position=this.position.vecAdd(this.velocity);
		var collidingActors = this.getCloseActors(0);
		for(var i in collidingActors)this.collide(collidingActors[i]);
			
		// bounce off the walls
		if(this.position.x<0){
			this.position.x=0;
			this.velocity.x=Math.abs(this.velocity.x);
		}
		if(this.position.x>this.stage.width){
			this.position.x=this.stage.width;
			this.velocity.x=-Math.abs(this.velocity.x);
		}
		if(this.position.y<0){
			this.position.y=0;
			this.velocity.y=Math.abs(this.velocity.y);
		}
		if(this.position.y>this.stage.height){
			this.position.y=this.stage.height;
			this.velocity.y=-Math.abs(this.velocity.y);
		}
		this.changed = true;
    }
    getAttr(){
        return {'colour':this.colour, 'position':this.position.toInt(), 'radius':this.radius, 'isZombie':this.isZombie};
    }
}

class Ball extends Actor {
	constructor(stage, position, velocity, colour, radius){
		super(stage, position, velocity, colour, radius);
	}
	
	headTo(position){
		this.velocity = position.vecSub(this.position).normalize();
	}
    getAttr(){
        return {...{'type': 'ball'}, ...super.getAttr()};
    }
	toString(){
		return this.position.toString() + " " + this.velocity.toString();
	}
}

class Box extends Actor {
	constructor(stage, position, colour, radius){
		var velocity = new Pair(0,0);
		super(stage, position, velocity, colour, radius);
    }
    getAttr(){
        return {...{'type': 'box'}, ...super.getAttr()};
    }
	step(){ this.changed = this.isZombie; }
}

class Tank extends Actor {
	constructor(stage, position, velocity, colour, radius, ws){
		super(stage, position, velocity, colour, 10);

		this.stateVars.concat["fire", "amunition", "pickup"];

		this.turretDirection = new Pair(1,0);
		this.fire = false; // whether we have to fire a bullet in the next step
		this.pickup = false;
        this.ammunition = 0;
        this.ws = ws; //for identification
    }
    setCanvas(data){
        this.canvasWidth = data.canvasWidth;
        this.canvasHeight = data.canvasHeight;
    }
    /** Handle the mouse movement on the stage in canvas coordinates **/
    mouseMove(x,y){
        var canvasPosition=new Pair(x,y);
        var worldPosition=this.mapCanvasToWorld(canvasPosition);
        this.pointTurret(worldPosition);
	}
	// Map an canvas coordinates to world coordinates
	mapCanvasToWorld(canvasPosition){
		var halfCanvas = (new Pair(this.canvasWidth/2, this.canvasHeight/2)).toInt();
		var playerPosition = this.position.toInt();

		var worldPosition = canvasPosition.vecAdd(playerPosition.vecSub(halfCanvas));
		return worldPosition;
    }
	/** Handle the mouse click on the stage in canvas coordinates **/
	mouseClick(x,y){
        this.mouseMove(x,y);
		this.setFire(true);
	}
	// Point the turret at crosshairs in world coordinates
	pointTurret(crosshairs){
		var delta = crosshairs.toInt().vecSub(this.position.toInt());
		if(delta.x!=0 || delta.y !=0){
			this.turretDirection = delta.normalize();
		}
	}
	getTurretPosition(){
		return this.position.vecAdd(this.turretDirection.sProd(this.radius));
	}
	step(){
		if(this.fire && this.amunition>0){
			this.amunition--;
			var bulletVelocity = this.turretDirection.sProd(5).vecAdd(this.velocity);
			var bulletPosition = this.position.vecAdd(this.turretDirection.sProd(this.radius*2));;
			var bullet = new Bullet(this.stage, bulletPosition, bulletVelocity, "#000000", this.radius/5);
			this.stage.addActor(bullet);
		}
		this.setFire(false);

		if(this.pickup){
			var closeActors = this.getCloseActors(5); // we may not be touching, but pick them up just the same
			var closeActor = closeActors.find(actor => actor.constructor.name=="Box");
			if(closeActor){
				this.amunition=30;
				this.health = 10;
			}
		}
		this.setPickup(false);

		super.step();
		this.velocity=this.velocity.sProd(.95);
	}
	setDirection(dx,dy){
		var newDirection = new Pair(dx,dy);
		var newVelocity = this.velocity.vecAdd(newDirection);
		var m = newVelocity.norm2();
		if(m>5)newVelocity=newVelocity.normalize().sProd(5);
		this.velocity = newVelocity;
    }
    getAttr(){
        return {...{'type': 'player',  'turretPos': this.getTurretPosition().toInt(), 'hash':this.ws}, ...super.getAttr()};
    }
	setFire(val){ this.fire = val; }
	setPickup(val){ this.pickup = val; }
}
class Bullet extends Actor {
	constructor(stage, position, velocity, colour, radius){
		super(stage, position, velocity, colour, radius);
		this.lifetime = 200;
	}

	collide(other, newState){
		this.makeZombie();
		other.health--;
		if(other.health<=0)other.makeZombie();
	}

	step(){
		super.step();
		this.lifetime = this.lifetime -1;
		if(this.lifetime <= 0)this.makeZombie();
	}
    getAttr(){
        return {...{'type': 'bullet'}, ...super.getAttr()};
    }
}
module.exports = {Stage};