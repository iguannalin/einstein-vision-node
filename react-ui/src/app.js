import React, {Component} from 'react';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';
import superagent from 'superagent';

import './app.css';
import Spinner from './spinner';
import Predictions from './predictions';
import UploadTarget from './upload-target';

class App extends Component {

    state = {
        files: [],
        isProcessing: false,
        uploadError: null,
        uploadResponse: null,
        labels: {},
        scene: '',
        count: 0,
        product: 'pegasus'
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
                        Nike
                    </h1>
                    <div>
                        <p id="statement"></p>
                    </div>
                </div>
                <div className="button">
                    <select name="product-choice" onChange={this.handleButtonClick}>
                        <option value="react" selected>React FlyKnit</option>
                        <option value="pegasus">Pegasus</option>
                    </select>
                </div>
                <div className="footer">
                </div>
            </div>
        );
    }

    getScene = () => {
        if (this.state.labels.length > 0) {
            console.log('LABE  KEY', this.state.labels, typeof this.state.labels, this.state.labels.entries())
        }
        if (typeof this.state.labels === 'object') {
            for (let key in this.state.labels) {
                console.log('KEY ', key, this.state.labels[key]);
                if (this.state.labels[key] > this.state.count) {
                    console.log('THIS KEY', this.state.labels[key], this.state.count);
                    this.setState({
                        scene: key,
                        count: this.state.labels[key]
                    });
                }
                document.getElementById('statement').innerText = 'Your shoe seems to be seen a lot at the ' + this.state.scene + '.';
            }
        }
    };

    getFiles = () => {
        // Import all images in image folder by Gabriel Esu
        function importAll(r) {
            let images = {};
            r.keys().map((item) => {
                images[item.replace('./', '')] = r(item);
            });
            return images;
        }

        let images;

        if (this.state.product === 'pegasus') {
            images = importAll(require.context('../public/images/pegasus', false, /\.(gif|jpe?g|svg)$/));
        } else if (this.state.product === 'react') {
            images = importAll(require.context('../public/images/react', false, /\.(gif|jpe?g|svg)$/));
        }

        for (let key in images) {
            const url = images[key];
            console.log(key, url);
            fetch(url).then(data => data.blob()).then(res => {
                console.log('meow', res);
                let file = new File([res], key);
                this.handleClick([file]);
            });
        }
    }

    handleButtonClick = (e) => {
        this.setState({
            product: e.target.value
        });
        this.getFiles();
    };

    handleClick = (acceptedFiles) => {
        console.log('HANDLE CLICK ');
        console.log('HANDLE CLICK ', acceptedFiles);
        acceptedFiles.forEach(async (file) => {
            console.log('HANDLE CLICK ', file);
            const result = await this.onDrop([file]);
            console.log('HANLDE RESULT ', result)
        });
    };

    onDrop = (acceptedFiles, rejectedFiles) => {
        // acceptedFiles.map(file => Object.assign(file, {preview: URL.createObjectURL(file)}))
        console.log('WHAT ACCEPTED ', acceptedFiles);
        if (acceptedFiles.length) {
            // this.setState({
            //     isProcessing: true,
            //     files: acceptedFiles,
            //     uploadError: null,
            //     uploadResponse: null
            // });

            var req = superagent.post('/file-upload');
            acceptedFiles.forEach((file) => {
                // Backend expects 'file' reference
                req.attach('file', file, file.name);
            });
            req.end((err, res) => {
                // this.setState({isProcessing: false});
                if (err) {
                    console.log('file-upload error', err);
                    this.setState({uploadError: err.message});
                    return err;
                }
                console.log('file-upload response', res);
                let probabilities = JSON.parse(res.text).probabilities;
                probabilities.filter(item => item.probability > 0.5);
                probabilities.forEach(item => {
                    console.log('ITEM', item);
                    if (item.probability > 0.5) {
                        const tempLabels = this.state.labels;
                        if (item.label in this.state.labels) {
                            tempLabels[item.label] += 1;
                        } else {
                            tempLabels[item.label] = 1;
                        }
                        this.setState({
                            labels: tempLabels
                        });
                    }
                });
                this.getScene();
                console.log('PROBS', probabilities, this.state.labels, 'scene', this.state.scene);
                return res;
                // this.setState({uploadResponse: JSON.parse(res.text)});
            });
        }
    }
}

export default App;
