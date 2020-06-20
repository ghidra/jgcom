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
  padding-left:60px;
}
.header_nav{
  grid-column: 4;
}

.grid-container {
  display: grid;
  grid-column-gap: 2px;
  grid-template-columns: auto auto;
  padding: 40px;
  grid-row-gap: 2px;
}

.grid-item {
  border: 1px solid;
  border-color:#111111;
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

</style>