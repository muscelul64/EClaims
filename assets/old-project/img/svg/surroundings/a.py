import os
files = [f for f in os.listdir('.') if os.path.isfile(f)]
for f in files:
    print("import " + f[:-4] + " from '../../assets/img/svg/surroundings/" + f + "'")