import React, {Component} from 'react';
import superagent from 'superagent';

import './app.css';

class App extends Component {
    state = {
        labels: {},
        scene: '',
        count: 0,
        product: 'pegasus'
    };

    render() {
        return (
            <div className="component-card">
                <div className="title">
                    <h1 className="intro">
                        Nike
                    </h1>
                    <span className="dropdown">
                        <select name="product-choice" onChange={this.handleButtonClick}>
                            <option value="default">Choose one</option>
                            <option value="react">React FlyKnit</option>
                            <option value="pegasus">Pegasus</option>
                        </select>
                    </span>
                    <span className="prediction" id="statement"></span>
                </div>
                <div className="footer">
                </div>
            </div>
        );
    }

    getScene = () => {
        if (typeof this.state.labels === 'object') {
            for (let key in this.state.labels) {
                if (this.state.labels[key] > this.state.count) {
                    this.setState({
                        scene: key,
                        count: this.state.labels[key]
                    });
                }
                document.getElementById('statement').innerHTML = '...is often seen at the ' + this.state.scene + '.';
            }
        }
    };

    handleButtonClick = (e) => {
        this.setState({
            product: e.target.value
        });
        this.getFiles();
    };

    // Import all images in image folder by Gabriel Esu
    importAllImages = (r) => {
        let images = {};
        r.keys().map((item) => {
            images[item.replace('./', '')] = r(item);
        });
        return images;
    };

    getFiles = () => {
        let images;
        if (this.state.product === 'pegasus') {
            images = this.importAllImages(require.context('../public/images/pegasus', false, /\.(gif|jpe?g|svg)$/));
        } else if (this.state.product === 'react') {
            images = this.importAllImages(require.context('../public/images/react', false, /\.(gif|jpe?g|svg)$/));
        }

        this.fetchProbabilities(images);
    };

    fetchProbabilities(images) {
        for (let key in images) {
            const url = images[key];
            fetch(url).then(data => data.blob()).then(res => {
                let file = new File([res], key);
                this.onDrop([file]);
            });
        }
    }

    filterProbabilities = (res) => {
        let probabilities = JSON.parse(res.text).probabilities;
        probabilities.forEach(item => {
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
    };

    onDrop = (acceptedFiles) => {
        if (acceptedFiles.length) {
            let req = superagent.post('/file-upload');
            acceptedFiles.forEach((file) => {
                // Backend expects 'file' reference
                req.attach('file', file, file.name);
            });
            req.end((err, res) => {
                if (err) {
                    console.log('file-upload error', err);
                    this.setState({uploadError: err.message});
                    return err;
                }
                console.log('file-upload response', res);
                this.filterProbabilities(res);
                return res;
            });
        }
    }
}

export default App;
