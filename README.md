Toyz for Data Analysis and Reduction
====================================

What is Toyz?
-------------
Toyz was initially created as a way to view and interact with FITS images stored on a remote 
server, as well as perform data reduction needed for my PhD. I couldn't find any easy to use
and well documented astronomy tools for this task so I set out to create my own application.

In a nutshell Toyz is a web application framework designed to meet the needs of "Big Data"
scientists by allowing them to interact with their data via a web browser and run
scripts on a remote server (or perhaps a gpu cluster) that stores their data.
There are a few simple ideas that have been (and will continue to be) essential to the
development of toyz (think of it as a mission statement): 
    1. It should be easy to install with as few dependencies as possible
    2. It should take up a minimal amount of disk space
    3. It should be well documented and easy to user
    4. An undergraduate summer REU student should be able to start analyzing data with
       it on his/her first day!

Documentation
-------------
See the [documentation](http://fred3m.github.io/toyz/) for information on installing and
getting started with Toyz.

Sceenshots
----------
### Toyz
![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/user_settings.png)

User settings in admin console

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/group_settings.png)

Group settings in admin console

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/open_file.png)

Open a data file from the server using python, numpy, or pandas (astropy in the future)

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/plots.png)

Interactive plots using Highcharts (custom js plot libraries can also be used)

### Astropyp/ Astro pypelines
There are a number of feature from astopyp and astropypelines that will be added in the next few 
weeks. Here is a sneak preview of some of those features.

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/fitsviewer1.png)

Detecting stars with the fits image viewer

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/fitsviewer2.png)

Setting the contrast and bias with the fits image viewer

![alt text](https://github.com/fred3m/toyz/blob/master/screenshots/color_mag_.png)

Viewing interactive plots, surface plots, and image arrays that are all connected

More Coming Soon
----------------
This package is being converted from [astropyp](https://github.com/fred3m/astropyp) and 
[astro_pypelines](https://github.com/fred3m/astro_pypelines) into a more complete 
(and less specialized) data analysis package. This is an ongoing process and many
of the features haven't been transfered yet, however if you install 
[astropyp](https://github.com/fred3m/astropyp) 
and [astro_pypelines](https://github.com/fred3m/astro_pypelines) 
you will be able to use a preview of the package 
as applied to astronomy.

The goal is for the main interface to be completed by mid January (2015) while the astronomy 
tools should be ready sometime in February.
