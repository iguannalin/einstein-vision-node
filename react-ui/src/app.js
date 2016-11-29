import React, { Component } from 'react';
import Spinner from './spinner';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';
import superagent  from 'superagent';
import Predictions  from './predictions';
import UploadTarget  from './upload-target';

import './app.css';

class App extends Component {

  state = {
    files: [],
    isProcessing: false,
    uploadError: null,
    uploadResponse: null
  }

  render() {
    const file = this.state.files[0];
    const uploadError = this.state.uploadError;
    const isProcessing = this.state.isProcessing;
    const response = this.state.uploadResponse;
    const predictions = (response && response.probabilities) || [];

    return (
      <div>
        <div className="title">
          <h1 className="intro">
             Salesforce MetaMind 
            <br/> <span className="demo-text">Image Classification Demo</span>  
          </h1>
        </div>
        <div className={classNames(
          "app",
          file != null ? "app-with-image" : null)}>
          {response || isProcessing ? null : <Dropzone
            accept={'image/png, image/jpeg'}
            multiple={false}
            onDrop={this.onDrop}
            style={{}}
            className={classNames(
              'dropzone','initial-dropzone',
              file != null ? 'dropzone-dropped' : null
            )}
            activeClassName="dropzone-active"
            rejectClassName="dropzone-reject">
            <UploadTarget/>
          </Dropzone>}

          
          <Dropzone
              accept={'image/png, image/jpeg'}
              multiple={false}
              onDrop={this.onDrop}
              style={{}}
              className={classNames(
                'dropzone',
                file != null ? 'dropzone-dropped' : null
              )}
              activeClassName="dropzone-active"
              rejectClassName="dropzone-reject">
          <div className="result-wrapper">
              <div className={classNames(
                'image-preview',
                file != null ? 'image-preview-visible' : null)}>
              
                <img src={file && file.preview} style={{ display: 'block' }}/>
                {!response || isProcessing ? null : 
                  <div className="prompt">Drop image here or tap to upload</div>
                }
                <div className="spinner-wrapper">
                  {isProcessing
                    ? <span><Spinner/><div className="spinner-text">Analyzing Image...</div></span>
                    : null}
                  {uploadError
                    ? uploadError
                    :null}
                </div>
              </div>
            
            <Predictions contents={predictions}/>
          </div>
          </Dropzone>
        </div>

        <div className="footer">
          <a href="http://metamind.io/">metamind.io</a>
          <a href="https://github.com/heroku/metamind-image-identifier" 
             target="_blank">github</a>
        </div>
      </div>
    );
  }

  onDrop = (acceptedFiles, rejectedFiles) => {
    if (acceptedFiles.length) {
      this.setState({
        isProcessing: true,
        files: acceptedFiles,
        uploadError: null,
        uploadResponse: null
      });

      var req = superagent.post('/file-upload');
      acceptedFiles.forEach((file)=> {
        // Backend expects 'file' reference
        req.attach('file', file, file.name);
      });
      req.end((err,res) => {
        this.setState({ isProcessing: false });
        if (err) {
          console.log('file-upload error', err);
          this.setState({ uploadError: err.message });
          return;
        }
        console.log('file-upload response', res);
        this.setState({ uploadResponse: JSON.parse(res.text) });
      });
    }
  }
}

export default App;