.. _viewer:

************
Image Viewer
************
For a video demonstration of the image viewer see

.. raw:: html

    <iframe width="420" height="315" src="https://www.youtube.com/embed/alP0T5oZuBc" 
    frameborder="0" allowfullscreen></iframe>

Toyz also comes with an image viewer that allows the user to view images stored on the server.
Because it's often cumbersome and time consuming to load and view very large images, the image
viewer also allows users to view images using mosaic tiles that only load parts of the image that
are currently viewed.

Creating a new Viewer
=====================
To create a new Image Viewer tile first create a new **Viewer** tile (see :ref:`add_tile` 
for more), which open up a control panel next to the viewer.

Image Viewer Controls
=====================
By default the image viewer has 5 sets of controls but it is possible for a user to create and
modify these groups by creating a :ref:`custom_toy`. For example, the
`Astro-Toyz <https://github.com/fred3m/astro-toyz>`_ package adds controls that allow
the user to view WCS, make surface plots from part of an image, and align images
based on their WCS.

Image Controls
--------------
These green colored controls are used to open and navigate through a single image. For now
these only work for FITS images that have multipe frames but eventually this will
navigate through the directory that holds the current image.

Load Image
^^^^^^^^^^
Loads an image from the server. Clicking the **load image** button open up a dialog that allows
the user to choose an image type. Currently only **image**, which simply opens an image from a 
specified path, and **large image** which open sections of a large image as a set of mosaic tiles
to save time and memory, are supported. In the future combined image will be able to load and
display mosaics made from multiple images, such as multiple frame fits files in the same
image viewer.

You can also click on the ``...`` button to open a file dialog to select an available file
from the server.

Frame Controls
^^^^^^^^^^^^^^
The controls to the right of the **load image** button are all used to navigate between file
frames. Currently this just means the different frames of a multi-extension fits file, all other
image types just have a single frame.

Viewer Controls
---------------
The purple controls are used to navigate between different viewer frames. Viewer frames are used
to allow multiple images to be viewed as a slideshow in the viewer, which is often useful when
comparing images, looking for moving objects, etc.

Add Viewer Frame
^^^^^^^^^^^^^^^^
This adds a new frame to the image viewer. 

Remove Viewer Frame
^^^^^^^^^^^^^^^^^^^
Removes the current frame from the viewer

Viewer Frame Controls
^^^^^^^^^^^^^^^^^^^^^
Allows the user to cycle through differnt viewer frames.

.. _zoom_controls:

Zoom Controls
-------------
The blue buttons control the scaling of the image, which is done differently for regular
**images** and **large images**.  For regular images, the ``resize`` function in the 
`Pillow <https://pillow.readthedocs.org/>`_ or 
(`PIL <http://www.pythonware.com/products/pil/>`_) library, which uses smoothing functions to
make smaller images appear crisper and enlarged images less pixelated.

Since the reason for using a separate image viewer for large images is save time and memory,
it doesn't make sense to scale them in the same way since a large bottleneck is the mapping of
an array to rgba image data.

Instead, scaling is done differntly depending on whether or not 
`scipy <http://www.scipy.org/>`_ is loaded. If it is, the ``scipy.ndimage.zoom`` function is
used for both upscaling and downscaling, used a nearest neighbor algorithm. If **scipy** is 
not installed, the data array is sliced for downscaling and uses ``numpy.kron`` for 
upscaling (which only works for powers of 2). For this reason it is recommended to install
**scipy**.

The upside to using this scaling proceedure for large images is that it allows the program
to scale tiles of an image that can smoothly be tiled together in very little time, and without
losing the raw pixel values for upscaled images. The downside is that downscaled images appear
choppy compared to properly scaled images (which would require loading the entire image, 
defeating the purpose of tiling the image in the first place!).

Tools
-----
The gray buttons are tools that control the actions of the cursor when interacting with the 
image. Below is a description of the tools (from left to right).

Rectangular zoom
^^^^^^^^^^^^^^^^
If the rectangular zoom tool is selected, clicking and draging on the image will zoom in so that
all of the selected area will be visible in the viewer.

Center
^^^^^^
Centers the image on the point where the user clicked.

Histogram
^^^^^^^^^
Displays a histogram of raw pixel values (not rgb colors) around the point where the user
clicked.

Surface Plot
^^^^^^^^^^^^
Displays a surface plot of the pixel values centered on the point the user clicked.

Colormap
^^^^^^^^
Allows the user to change the colormap for a raw image (for example a FITS image).

Image Info
----------
These fields display information about the image, such as the x/y location of the cursor,
the physical coordinates on the image (not yet implemented but used for multiextension fits
files), and the value of the pixel under the cursor.

Saving a Viewer Tile
====================
When a viewer tile is saved, the information to load each viewer frame, its images, and 
properties like the scale and location of the viewer window are all saved, but the images itself
are not (meaning if they are changed, loading the workspace will display the **new** images,
not the ones originally loaded).

.. warning::

    Browsers will often cache an image that it has loaded already, which can be problematic
    if you ar updating an images and trying to view changes. In this case opening a 
    private window in most browsers will prevent it from trying to cache the image and
    you can be sure that the image you are viewing is the current version.