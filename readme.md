#clone into an existing diretor (web root)
cd ~/path
git init
git remote add origin git@github.com:ghidra/jgcom.git
git fetch
git checkout -f -b master origin/master
