const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

let elCanvas
let puntos 

const sketch = ( { canvas } ) => {

  puntos = [ 
    new punto({x:200 , y:540}) ,
    new punto({x:400 , y:700 }) ,
    new punto({x:880 , y:540}),
    new punto({x:600 , y:700}),
    new punto({x:640 , y:900}),
     ]

  canvas.addEventListener( 'mousedown' , onMouseDown )
  elCanvas = canvas


  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = '#999'
    context.beginPath()
    context.moveTo( puntos[0].x , puntos[0].y )

    for ( let i = 1 ; i < puntos.length ; i++){
      context.lineTo(puntos[i].x , puntos[i].y )
    }

    context.stroke()

/* 
    context.beginPath()
    context.moveTo( puntos[0].x , puntos[0].y )

    for ( let i = 1 ; i < puntos.length ; i+= 2){
      context.quadraticCurveTo(puntos[i + 0 ].x , puntos[i + 0].y , puntos[i + 1].x, puntos[ i + 1].y)
    }

    context.stroke() */

    context.beginPath()


    for ( let i = 0 ; i < puntos.length - 1 ; i++){
      const curr = puntos[ i + 0 ]
      const next = puntos[ i + 1 ]

      const mx = curr.x + ( next.x - curr.x) * 0.5
      const my = curr.y + ( next.y - curr.y) * 0.5

      // dinujando

      /* context.beginPath()
      context.arc( mx , my , 5 , 0 , Math.PI * 2)
      context.fillStyle = 'blue'
      context.fill() */

      if( i === 0){
        context.moveTo(curr.x , curr.y)
      }else if ( i == puntos.length - 2) context.quadraticCurveTo(curr.x , curr.y , next.x , next.y)

      context.quadraticCurveTo( curr.x , curr.y , mx , my)

    }

    context.lineWidth = 4
    context.strokeStyle = 'blue'
    context.stroke()


    puntos.forEach( punto => {
      punto.dibujar(context)
    })

  };
};


const onMouseDown = (e) => {
  window.addEventListener('mousemove' , onMouseMove)
  window.addEventListener('mouseup' , onMouseUp)

  const x =( e.offsetX / elCanvas.offsetWidth) * elCanvas.width
  const y =( e.offsetY / elCanvas.offsetHeight) * elCanvas.height


  let hit = false

  puntos.forEach( punto => {
    punto.isDragging = punto.hitTest( x , y )
    if( !hit && punto.isDragging) hit = true
  })

  if(!hit) puntos.push( new punto({x,y}))

}


const onMouseMove = (e) => {

  const x =( e.offsetX / elCanvas.offsetWidth) * elCanvas.width
  const y =( e.offsetY / elCanvas.offsetHeight) * elCanvas.height

  puntos.forEach( punto => {
    if( punto.isDragging){
      punto.x = x,
      punto.y = y
    }
  })

}

const onMouseUp = (e) => {
  window.removeEventListener('mousemove' , onMouseMove)
  window.removeEventListener('mouseup' , onMouseUp)

}


canvasSketch(sketch, settings);


class punto  {
  constructor({ x , y , control = false}){
    this.x = x;
    this.y = y;
    this.control = control;
  }
  dibujar(context) {
    context.save()
    context.translate( this.x , this.y)
    context.fillStyle = this.control ? 'red' : 'black'

    context.beginPath()
    context.arc( 0 , 0 , 10 , 0 , Math.PI * 2)
    context.fill()


    context.restore()
  }
  hitTest ( x , y ) {
    const dx = this.x - x
    const dy = this.y - y
    const dd = Math.sqrt( dx * dx + dy * dy )
    return dd < 20
  }
}