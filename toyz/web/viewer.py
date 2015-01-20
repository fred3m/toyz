from __future__ import print_function, division
from collections import OrderedDict
from toyz.utils.errors import ToyzJobError
import math
import os
from toyz.utils import core

def get_file_info(filepath, tile_height=200, tile_width=400):
    ext_idx = 1
    ext = filepath.split('.')[-ext_idx].lower()
    if ext=='fz':
        ext_idx = 2
        ext = '.'.join(filepath.split('.')[-ext_idx:]).lower()
    file_info = {
        'ext': ext,
        'filename': '.'.join(os.path.basename(filepath).split('.')[:-ext_idx]),
        'filepath': filepath,
        'tile_width': tile_width,
        'tile_height': tile_height
    }
    
    if file_info['ext'] == 'fits' or file_info['ext'] == 'fits.fz':
        try:
            import astropy.io.fits as pyfits
        except ImportError:
            try:
                import pyfits
            except ImportError:
                raise ToyzJobError(
                    "You must have astropy or pyfits installed to view FITS images")
        # No need to check, since numpy is a dependence of astropy
        import numpy as np
        
        hdulist = pyfits.open(file_info['filepath'])
        file_info['hdulist'] = [hdu.__class__.__name__ for hdu in hdulist]
        file_info['images'] = OrderedDict([[str(n), {}] for n, hdu in enumerate(hdulist)
            if 'imagehdu' in hdu.__class__.__name__.lower()])
        if len(file_info['images']) == 0:
            raise ToyzJobError("FITS file does not contain any recognized image hdu's")
    else:
        file_info['images'] = {'0':{}}
        file_info['frame'] = 0
    
    return file_info

def get_window(viewer):
    viewer['x0']=int(viewer['x_center']-viewer['width']/viewer['scale']/2)
    viewer['y0']=int(viewer['y_center']-viewer['height']/viewer['scale']/2)
    viewer['xf']=int(viewer['x0']+viewer['width']/viewer['scale'])
    viewer['yf']=int(viewer['y0']+viewer['height']/viewer['scale'])
    return viewer

def get_best_fit(data_width, data_height, img_viewer):
    x_scale = img_viewer['width']/data_width
    y_scale = img_viewer['height']/data_height
    scale = y_scale;
    if x_scale<y_scale:
        scale = x_scale
    img_viewer['x_center'] = data_width/2
    img_viewer['y_center'] = data_height/2
    img_viewer['scale'] = scale
    img_viewer = get_window(img_viewer)
    return img_viewer

def get_img_info(file_info, save_path, img_viewer=None,
        frame=None, scale=None, colormap=None, px_min=None, px_max=None):
    if frame is None:
        frame = int(next(iter(file_info['images'])))
    
    if file_info['ext'] == 'fits' or file_info['ext'] == 'fits.fz':
        try:
            import astropy.io.fits as pyfits
        except ImportError:
            try:
                import pyfits
            except ImportError:
                raise ToyzJobError(
                    "You must have astropy or pyfits installed to view FITS images")
        # No need to check, since numpy is a dependence of astropy
        import numpy as np
        hdulist = pyfits.open(file_info['filepath'])
        data = hdulist[frame].data
        height, width = data.shape
        if px_min is None:
            px_min = float(data.min())
        if px_max is None:
             px_max = float(data.max())
        if colormap is None:
            colormap = 'Spectral'
    else:
        # For non-FITS formats, only a single large image is loaded, which 
        try:
            import Image
        except ImportError:
            raise ToyzJobError(
                "You must have PIL (Python Imaging Library) installed to "
                "open files of this type"
            )
        import numpy as np
        
        img = Image.open(file_info['filepath'])
        data = np.array(img)
        height, width, channels = data.shape
        px_min = 0
        px_max = 0
        colormap = ''
    
    if scale is None:
        if img_viewer is None:
            raise ToyzJobError("You must either supply a scale or image viewer parameters")
        if img_viewer['scale']<0:
            img_viewer = get_best_fit(width, height, img_viewer)
        scale = img_viewer['scale']
    elif img_viewer is None:
        img_viewer = {}
    
    img_info = {
        'frame': frame,
        'height': height,
        'width': width,
        'scale': scale,
        'scaled_height': int(math.ceil(height*scale)),
        'scaled_width': int(math.ceil(width*scale)),
        'tiles': {},
        'px_min': px_min,
        'px_max': px_max,
        'colormap': colormap,
        'save_path': save_path
    }
    
    img_info['columns'] = int(math.ceil(img_info['scaled_width']/file_info['tile_width']))
    img_info['rows'] = int(math.ceil(img_info['scaled_height']/file_info['tile_height']))
    img_info['viewer'] = img_viewer
    return img_info

def scale_data(file_info, img_info, tile_info, data):
    import numpy as np
    if img_info['scale']==1:
        data = data[tile_info['y0_idx']:tile_info['yf_idx'],
            tile_info['x0_idx']:tile_info['xf_idx']]
    elif img_info['scale']>1:
        #from scipy.ndimage.interpolation import zoom
        data = data[tile_info['y0_idx']:tile_info['yf_idx'],
            tile_info['x0_idx']:tile_info['xf_idx']]
        data = np.kron(data, np.ones((img_info['scale'],img_info['scale'])))
        #data = zoom(data, img_info['scale'], order=0)
        print('data size', data.shape)
    elif img_info['scale']<1 and img_info['scale']>0:
        tile_width = min(file_info['tile_width'],
            int((img_info['width']-tile_info['x0_idx'])*img_info['scale'])-1)
        tile_height = min(file_info['tile_height'],
            int((img_info['height']-tile_info['y0_idx'])*img_info['scale'])-1)
        print('tile_width', tile_width)
        print('tile_height', tile_height)
        print('width', img_info['width'])
        print('height', img_info['height'])
        print('x0_idx', tile_info['x0_idx'])
        print('y0_idx', tile_info['y0_idx'])
        print('yf_idx', tile_info['yf_idx'])
        print('scale', img_info['scale'])
        
        xmax = min(img_info['width']-1, tile_info['xf_idx'])
        ymax = min(img_info['height']-1, tile_info['yf_idx'])
        
        xIdx=np.linspace(tile_info['x0_idx'], xmax, tile_width)
        yIdx=np.linspace(tile_info['y0_idx'], ymax, tile_height)
        xIdx=np.array(xIdx,np.int)
        yIdx=np.reshape(np.array(yIdx,np.int),(yIdx.size,1))
        data = data[yIdx,xIdx]
    else:
        raise ToyzJobError('Scale must be a positive number')
    return data

def get_tile_info(file_info, img_info):
    """
    Get info for all tiles available in the viewer. If the tile has not been loaded yet,
    it is added to the new_tiles array.
    """
    x0 = img_info['viewer']['x0']
    y0 = img_info['viewer']['y0']
    xf = img_info['viewer']['xf']
    yf = img_info['viewer']['yf']
    
    all_tiles = []
    new_tiles = {}
    
    minCol = int(max(0,math.floor(x0/file_info['tile_width'])))
    maxCol=int(min(img_info['columns'],math.ceil(xf/file_info['tile_width'])))
    minRow = int(max(0,math.floor(y0/file_info['tile_height'])))
    maxRow = int(min(img_info['rows'],math.ceil(yf/file_info['tile_height'])))
    
    block_width = int(math.ceil(file_info['tile_width']/img_info['scale']))
    block_height = int(math.ceil(file_info['tile_height']/img_info['scale']))
    file_info['tile_height'] = block_height * img_info['scale']
    file_info['tile_width'] = block_width * img_info['scale']
    
    for row in range(minRow,maxRow):
        y0 = row*file_info['tile_height']
        yf = (row+1)*file_info['tile_height']
        y0_idx = int(y0/img_info['scale'])
        #yf_idx = int(math.ceil(yf/img_info['scale']))
        #y0_idx = block_height * row
        #yf_idx = block_height * (row+1)
        yf_idx = y0_idx + block_height
        for col in range(minCol,maxCol):
            all_tiles.append(str(col)+','+str(row))
            if str(col)+','+str(row) not in img_info['tiles']:
                x0 = col*file_info['tile_width']
                xf = (col+1)*file_info['tile_width']
                x0_idx = int(x0/img_info['scale'])
                #xf_idx = int(math.ceil(xf/img_info['scale']))
                #x0_idx = block_width * col
                #xf_idx = block_width * (col+1)
                xf_idx = x0_idx+block_width
                filename_params = [file_info['filename'], 
                    x0_idx, xf_idx, y0_idx, yf_idx, 
                    "{0:.3f}".format(img_info['scale']), img_info['colormap'], 
                    "{0:.2f}".format(img_info['px_min']), "{0:.2f}".format(img_info['px_max'])]
                new_filename = '_'.join([str(f) for f in filename_params])
                new_filepath = os.path.join(img_info['save_path'], new_filename+'.png')
                tile = {
                    'bottom': y0,
                    'top': yf,
                    'left': x0,
                    'right': xf,
                    'y0_idx': y0_idx,
                    'yf_idx': yf_idx,
                    'x0_idx': x0_idx,
                    'xf_idx': xf_idx,
                    'new_filepath': new_filepath,
                    'loaded': False,
                    'row': row,
                    'col': col,
                    'x': col*file_info['tile_width'],
                    'y': row*file_info['tile_height']
                }
                new_tiles[str(col)+','+str(row)] = tile
    return all_tiles, new_tiles

def create_tile(file_info, img_info, tile_info):
    try:
        import Image
    except ImportError:
        raise ToyzJobError(
            "You must have PIL (Python Imaging Library) installed to "
            "open files of this type"
        )
    
    if file_info['ext'] == 'fits' or file_ext['ext'] == 'fits.fz':
        try:
            import astropy.io.fits as pyfits
        except ImportError:
            try:
                import pyfits
            except ImportError:
                raise ToyzJobError(
                    "You must have astropy or pyfits installed to view FITS images")
        # No need to check, since numpy is a dependence of astropy
        import numpy as np
        try:
            from matplotlib import cm as cmap
            from matplotlib.colors import Normalize, LinearSegmentedColormap
        except ImportError:
            raise ToyzJobError("You must have matplotlib installed to load FITS images")
        
        hdulist = pyfits.open(file_info['filepath'])
        data = hdulist[img_info['frame']].data
        data = scale_data(file_info, img_info, tile_info, data)
        # FITS images have a flipped y-axis from what browsers and other image formats expect
        data = np.flipud(data)
        
        #TODO: remove the following test lines
        #img_info['px_min'] = 0
        #img_info['px_max'] = 500
        #img_info['colormap'] = 'afmhot'
        
        norm = Normalize(img_info['px_min'], img_info['px_max'], True)
        colormap = getattr(cmap, img_info['colormap'])
        cm = cmap.ScalarMappable(norm, colormap)
        img = np.uint8(cm.to_rgba(data)*255)
        img = Image.fromarray(img)
    else:
        # For non-FITS formats, only a single large image is loaded, which 
        import numpy as np
        
        img = Image.open(img_info['filepath'])
        img = img.crop((tile_info['left'], tile_info['bottom'], 
            img_info['tile_width'], img_info['tile_height']))
        img = img.resize(
            (img_info['tile_width']*img_info['scale'], 
            img_info['tile_height']*img_info['scale']),
            Image.ANTIALIAS)
    
    path = os.path.dirname(tile_info['new_filepath'])
    core.create_paths([path])
    img.save(tile_info['new_filepath'])