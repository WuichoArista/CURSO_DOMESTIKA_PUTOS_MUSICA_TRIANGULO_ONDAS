const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random')
const math = require('canvas-sketch-util/math')
const eases = require('eases')
const colormap = require('colormap')
const interpolate = require('color-interpolate')

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

const particulas = []

const cursor = { x: 9999 , y: 9999}

const colors = colormap({
  colormap: 'viridis',
  nshades: 20
})


let elCanvas;
let imgA , imgB;


const sketch = ({ width, height , canvas }) => {

  let x, y , particula , radius ;

  const imgACanvas = document.createElement('canvas')
  const imgAContext = imgACanvas.getContext('2d')

  const imgBCanvas = document.createElement('canvas')
  const imgBContext = imgBCanvas.getContext('2d')


  imgACanvas.width = imgA.width
  imgACanvas.height =imgA.height

  imgBCanvas.width = imgB.width
  imgBCanvas.height =imgB.height

  imgAContext.drawImage(imgA , 0 ,0)
  imgBContext.drawImage(imgB , 0 ,0)

  const imAData = imgAContext.getImageData(0,0,imgA.width , imgA.height).data
  const imBData = imgBContext.getImageData(0,0,imgB.width , imgB.height).data

  let pos = []

  const numCirculos = 30
  const gapCirculos = 2
  const gapDot = 2
  let dotRadius = 12 
  let cirRadius = 0
  const fitRadius = dotRadius

  elCanvas = canvas

  canvas.addEventListener( 'mousedown' , onMouseDown)

  for( let i = 0 ; i < numCirculos ; i++){
    const circumference = Math.PI * 2 * cirRadius
    const numFit = i ?  Math.floor(circumference / ( fitRadius * 2 + gapDot)) : 1
    const fitSlice = Math.PI * 2 / numFit
    let ix , iy , idx , r , g, b, colA , colB , colMap;

    for( let j = 0 ; j < numFit ; j++){
      const theta = fitSlice * j

      x = Math.cos(theta) * cirRadius
      y = Math.sin(theta) * cirRadius

      x+= width * 0.5
      y+= width * 0.5

      ix = Math.floor(( x / width) * imgA.width)
      iy = Math.floor(( y / height) * imgA.height)
      idx = ( iy * imgA.width + ix ) * 4

      r = imAData[idx + 0]
      g = imAData[idx + 1]
      b = imAData[idx + 2]

      colA = `rgb(${r} , ${g} , ${b})`



      //radius = dotRadius
      radius = math.mapRange(r ,0 ,255 ,1 ,12)

      ix = Math.floor(( x / width) * imgB.width)
      iy = Math.floor(( y / height) * imgB.height)
      idx = ( iy * imgB.width + ix ) * 4


      r = imBData[idx + 0]
      g = imBData[idx + 1]
      b = imBData[idx + 2]

      colB = `rgb(${r} , ${g} , ${b})`

      colMap = interpolate([colA , colB])


      particula = new Particula({ x , y , radius , colMap })
      particulas.push( particula )

    }

    cirRadius += fitRadius * 2 + gapCirculos
    
    //dotRadius = ( 1 -  i / numCirculos) * fitRadius
    dotRadius = ( 1 - eases.quadOut( i / numCirculos)) * fitRadius
  }


 /*  for( let i = 0 ; i < 200 ; i++){
    x = width * 0.5
    y = height * 0.5

    random.insideCircle(400 , pos)
    x += pos[0]
    y += pos[1]

    particula = new Particula({ x , y })

    particulas.push( particula )

  } */

  return ({ context, width, height }) => {
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    //context.drawImage( imgACanvas ,0 ,0)
    //context.drawImage( imgBCanvas ,0 ,0)

  particulas.sort(( a, b ) => a.scale - b.scale)

    particulas.forEach( particula => {
      particula.update()
      particula.draw(context)
    })

  };
};

const onMouseDown = (e) => {
  window.addEventListener('mousemove' , onMouseMove)
  window.addEventListener('mouseup' , onMouseUp)

  onMouseMove(e)
}

const onMouseMove = (e) => {
  const x = ( e.offsetX / elCanvas.offsetWidth ) * elCanvas.width
  const y = ( e.offsetY / elCanvas.offsetHeight ) * elCanvas.height

  cursor.x = x
  cursor.y = y

  console.log(cursor)

}

const onMouseUp = () => {
  window.removeEventListener('mousemove' , onMouseMove)
  window.removeEventListener('mouseup' , onMouseUp)

  cursor.x = 9999
  cursor.y = 9999

}


const cargarImagen = async( url ) => {
  return new Promise( (resolve , reject) => {
    const img = new Image();
    img.onload = () => resolve(img)
    img.onerror = () => reject()
    img.src = url
  })
} 

const start = async() => {

  imgA = await cargarImagen('./retrato.jpeg')
  imgB = await cargarImagen('./retrato4.jpg')

  canvasSketch(sketch, settings);

}
start()

class Particula {
  constructor({ x , y , radius = 10 , colMap}){
    //posicion
    this.x = x;
    this.y = y;

    //aceleracion
    this.ax = 0
    this.ay = 0

    //velocidad
    this.vx = 0
    this.vy = 0

    //posicion inicial
    this.ix = x
    this.iy = y

    this.radius = radius
    this.scale = 1
    this.colMap = colMap
    this.color = colMap(0)

    
    this.minDist = random.range(100 , 200)
    this.pushFactor = random.range(0.01 , 0.02)
    this.pullFactor = random.range(0.002 , 0.006)
    this.dampFactor = random.range(0.90 , 0.95)
  }

  update(){

    let dx , dy , dd , distDelta;
    let idxColor; 

    // pull force
    dx = this.ix - this.x
    dy = this.iy - this.y
    dd = Math.sqrt(dx * dx + dy * dy)


    this.ax = dx * this.pullFactor
    this.ay = dy * this.pullFactor

    this.scale = math.mapRange( dd, 0 , 200 , 1 , 5)

    //idxColor = Math.floor(math.mapRange( dd , 0 ,200 ,0, colors.length - 1 , true))
   // this.color = colors[idxColor]

    this.color = this.colMap(math.mapRange(dd , 0 , 200 , 0 , 1 , true))

    //push force
    dx = this.x - cursor.x
    dy = this.y - cursor.y
    dd = Math.sqrt(dx * dx + dy * dy)

    distDelta = this.minDist - dd

    if(dd < this.minDist ){
      this.ax += ( dx / dd) * distDelta * this.pushFactor
      this.ay += ( dy / dd) * distDelta * this.pushFactor
    }

    this.ax += 0.001

    this.vx += this.ax
    this.vy += this.ay

    this.vx *= this.dampFactor
    this.vy *= this.dampFactor

    this.x += this.vx
    this.y += this.vy
  }

  draw(context){
    context.save()
    context.translate( this.x , this.y)
    context.fillStyle = this.color

    context.beginPath()
    context.arc( 0, 0, this.radius * this.scale, 0 , Math.PI * 2)
    context.fill()

    context.restore()
  }
}