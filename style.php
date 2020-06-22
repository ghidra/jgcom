<style>
body{
  background-color: black;
  color:white;
}
.header_container{
  display:grid;
  grid-template-columns: auto auto auto auto;
}
.header_title{
  grid-column: 1 / 3;
  padding-left:80px;
}
.header_nav{
  grid-column: 4;
  text-align: right;
  padding-right:80px;
}

.grid-container {
  display: grid;
  grid-column-gap: 20px;
  grid-template-columns: auto auto;
  padding: 60px;
  grid-row-gap: 40px;
}

.grid-item {
  /*border: 1px solid;*/
  /*border-color:#111111;*/
  background-color: #111111;
  margin:10px;
  padding:20px;
}

.grid-iframe {
  overflow: hidden;
  padding-top: 56.25%;
  position: relative;
}
 
.grid-iframe iframe {
   border: 0;
   height: 100%;
   left: 0;
   position: absolute;
   top: 0;
   width: 100%;
}
.desription{
  padding-top:20px;
  color:#555555;
}
.clickable{
  cursor: pointer;
}
#overlay{
  position:absolute;
  top:0;
  left:0;
  width: 100%;
  z-index:1;
  height: 100%;
}

#overlay div{
  position: relative; 
  left: 50%; 
  margin-left:-150px;
  border: 1px solid #666;
  background-color: #000;
  border-radius:5px;
  color: #FFF;
  width:300px;
  z-index:3;
  top:10px;
}

#overlay div.background{
  position: absolute; 
  width:100%;
  height: 100%;
  margin:auto;
  background-color: #000;
  opacity:0.5;
  z-index:2;
  top:0;
  left:0;
}

</style>