
namespace CommandBuilder {
	partial class FParam {
		/// <summary>
		/// Required designer variable.
		/// </summary>
		private System.ComponentModel.IContainer components = null;

		/// <summary>
		/// Clean up any resources being used.
		/// </summary>
		/// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		protected override void Dispose(bool disposing) {
			if(disposing && (components != null)) {
				components.Dispose();
			}
			base.Dispose(disposing);
		}

		#region Windows Form Designer generated code

		/// <summary>
		/// Required method for Designer support - do not modify
		/// the contents of this method with the code editor.
		/// </summary>
		private void InitializeComponent() {
			this.pnlTítulo = new System.Windows.Forms.Panel();
			this.lblTítulo = new System.Windows.Forms.Label();
			this.pnlContenido = new System.Windows.Forms.Panel();
			this.pnlDesc = new System.Windows.Forms.Panel();
			this.tbDesc = new ControLib.SleekTextBox();
			this.lblDescripción = new System.Windows.Forms.Label();
			this.pnlTipo = new System.Windows.Forms.Panel();
			this.cmbTipos = new System.Windows.Forms.ComboBox();
			this.lblTipo = new System.Windows.Forms.Label();
			this.pnlNombre = new System.Windows.Forms.Panel();
			this.tbNombre = new ControLib.SleekTextBox();
			this.lblNombre = new System.Windows.Forms.Label();
			this.pnlOpciones = new System.Windows.Forms.Panel();
			this.btnAgregar = new ControLib.SleekButton();
			this.btnEliminar = new ControLib.SleekButton();
			this.btnCancelar = new ControLib.SleekButton();
			this.pnlTítulo.SuspendLayout();
			this.pnlContenido.SuspendLayout();
			this.pnlDesc.SuspendLayout();
			this.pnlTipo.SuspendLayout();
			this.pnlNombre.SuspendLayout();
			this.pnlOpciones.SuspendLayout();
			this.SuspendLayout();
			// 
			// pnlTítulo
			// 
			this.pnlTítulo.AutoSize = true;
			this.pnlTítulo.Controls.Add(this.lblTítulo);
			this.pnlTítulo.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTítulo.Location = new System.Drawing.Point(0, 0);
			this.pnlTítulo.Name = "pnlTítulo";
			this.pnlTítulo.Size = new System.Drawing.Size(535, 45);
			this.pnlTítulo.TabIndex = 2;
			// 
			// lblTítulo
			// 
			this.lblTítulo.AutoSize = true;
			this.lblTítulo.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblTítulo.Font = new System.Drawing.Font("Segoe UI Black", 24F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
			this.lblTítulo.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(231)))), ((int)(((byte)(78)))), ((int)(((byte)(39)))));
			this.lblTítulo.Location = new System.Drawing.Point(0, 0);
			this.lblTítulo.Name = "lblTítulo";
			this.lblTítulo.Size = new System.Drawing.Size(298, 45);
			this.lblTítulo.TabIndex = 5;
			this.lblTítulo.Text = "Nuevo Parámetro";
			// 
			// pnlContenido
			// 
			this.pnlContenido.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(20)))), ((int)(((byte)(20)))), ((int)(((byte)(20)))));
			this.pnlContenido.Controls.Add(this.pnlDesc);
			this.pnlContenido.Controls.Add(this.pnlTipo);
			this.pnlContenido.Controls.Add(this.pnlNombre);
			this.pnlContenido.Dock = System.Windows.Forms.DockStyle.Fill;
			this.pnlContenido.Location = new System.Drawing.Point(0, 45);
			this.pnlContenido.Name = "pnlContenido";
			this.pnlContenido.Padding = new System.Windows.Forms.Padding(12, 8, 12, 8);
			this.pnlContenido.Size = new System.Drawing.Size(535, 199);
			this.pnlContenido.TabIndex = 0;
			// 
			// pnlDesc
			// 
			this.pnlDesc.Controls.Add(this.tbDesc);
			this.pnlDesc.Controls.Add(this.lblDescripción);
			this.pnlDesc.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlDesc.Location = new System.Drawing.Point(12, 128);
			this.pnlDesc.Name = "pnlDesc";
			this.pnlDesc.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlDesc.Size = new System.Drawing.Size(511, 60);
			this.pnlDesc.TabIndex = 2;
			// 
			// tbDesc
			// 
			this.tbDesc.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbDesc.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbDesc.BorderRadius = 100F;
			this.tbDesc.BorderSize = 0F;
			this.tbDesc.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbDesc.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbDesc.FocusColor = System.Drawing.Color.Empty;
			this.tbDesc.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.tbDesc.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbDesc.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbDesc.InputText = "";
			this.tbDesc.Location = new System.Drawing.Point(0, 15);
			this.tbDesc.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbDesc.Multiline = false;
			this.tbDesc.Name = "tbDesc";
			this.tbDesc.PasswordChar = '\0';
			this.tbDesc.PercentualRadius = true;
			this.tbDesc.PlaceHolder = "Descripción";
			this.tbDesc.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbDesc.ReadOnly = false;
			this.tbDesc.SelectAllOnClick = true;
			this.tbDesc.Size = new System.Drawing.Size(511, 39);
			this.tbDesc.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbDesc.TabIndex = 0;
			this.tbDesc.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbDesc.WordWrap = true;
			// 
			// lblDescripción
			// 
			this.lblDescripción.AutoSize = true;
			this.lblDescripción.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblDescripción.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblDescripción.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblDescripción.Location = new System.Drawing.Point(0, 0);
			this.lblDescripción.Name = "lblDescripción";
			this.lblDescripción.Size = new System.Drawing.Size(89, 15);
			this.lblDescripción.TabIndex = 1;
			this.lblDescripción.Text = "DESCRIPCIÓN";
			this.lblDescripción.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlTipo
			// 
			this.pnlTipo.Controls.Add(this.cmbTipos);
			this.pnlTipo.Controls.Add(this.lblTipo);
			this.pnlTipo.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlTipo.Location = new System.Drawing.Point(12, 68);
			this.pnlTipo.Name = "pnlTipo";
			this.pnlTipo.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlTipo.Size = new System.Drawing.Size(511, 60);
			this.pnlTipo.TabIndex = 1;
			// 
			// cmbTipos
			// 
			this.cmbTipos.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.cmbTipos.Dock = System.Windows.Forms.DockStyle.Fill;
			this.cmbTipos.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
			this.cmbTipos.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.cmbTipos.FormattingEnabled = true;
			this.cmbTipos.Location = new System.Drawing.Point(0, 15);
			this.cmbTipos.Name = "cmbTipos";
			this.cmbTipos.Size = new System.Drawing.Size(511, 28);
			this.cmbTipos.TabIndex = 0;
			// 
			// lblTipo
			// 
			this.lblTipo.AutoSize = true;
			this.lblTipo.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblTipo.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblTipo.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblTipo.Location = new System.Drawing.Point(0, 0);
			this.lblTipo.Name = "lblTipo";
			this.lblTipo.Size = new System.Drawing.Size(36, 15);
			this.lblTipo.TabIndex = 1;
			this.lblTipo.Text = "TIPO";
			this.lblTipo.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlNombre
			// 
			this.pnlNombre.Controls.Add(this.tbNombre);
			this.pnlNombre.Controls.Add(this.lblNombre);
			this.pnlNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.pnlNombre.Location = new System.Drawing.Point(12, 8);
			this.pnlNombre.Name = "pnlNombre";
			this.pnlNombre.Padding = new System.Windows.Forms.Padding(0, 0, 0, 6);
			this.pnlNombre.Size = new System.Drawing.Size(511, 60);
			this.pnlNombre.TabIndex = 0;
			// 
			// tbNombre
			// 
			this.tbNombre.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(27)))), ((int)(((byte)(35)))), ((int)(((byte)(44)))));
			this.tbNombre.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.tbNombre.BorderRadius = 100F;
			this.tbNombre.BorderSize = 0F;
			this.tbNombre.Cursor = System.Windows.Forms.Cursors.IBeam;
			this.tbNombre.Dock = System.Windows.Forms.DockStyle.Fill;
			this.tbNombre.FocusColor = System.Drawing.Color.Empty;
			this.tbNombre.Font = new System.Drawing.Font("Segoe UI", 11F);
			this.tbNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.tbNombre.InputText = "";
			this.tbNombre.Location = new System.Drawing.Point(0, 15);
			this.tbNombre.MinimumSize = new System.Drawing.Size(20, 20);
			this.tbNombre.Multiline = false;
			this.tbNombre.Name = "tbNombre";
			this.tbNombre.PasswordChar = '\0';
			this.tbNombre.PercentualRadius = true;
			this.tbNombre.PlaceHolder = "Nombre";
			this.tbNombre.PlaceHolderColor = System.Drawing.Color.FromArgb(((int)(((byte)(55)))), ((int)(((byte)(73)))), ((int)(((byte)(94)))));
			this.tbNombre.ReadOnly = false;
			this.tbNombre.SelectAllOnClick = true;
			this.tbNombre.Size = new System.Drawing.Size(511, 39);
			this.tbNombre.Style = ControLib.SleekTextBox.TextBoxStyle.RoundRect;
			this.tbNombre.TabIndex = 0;
			this.tbNombre.TextAlign = System.Windows.Forms.HorizontalAlignment.Left;
			this.tbNombre.WordWrap = true;
			// 
			// lblNombre
			// 
			this.lblNombre.AutoSize = true;
			this.lblNombre.Dock = System.Windows.Forms.DockStyle.Top;
			this.lblNombre.Font = new System.Drawing.Font("Lato Black", 9F);
			this.lblNombre.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(98)))), ((int)(((byte)(98)))), ((int)(((byte)(136)))));
			this.lblNombre.Location = new System.Drawing.Point(0, 0);
			this.lblNombre.Name = "lblNombre";
			this.lblNombre.Size = new System.Drawing.Size(60, 15);
			this.lblNombre.TabIndex = 1;
			this.lblNombre.Text = "NOMBRE";
			this.lblNombre.TextAlign = System.Drawing.ContentAlignment.MiddleLeft;
			// 
			// pnlOpciones
			// 
			this.pnlOpciones.Controls.Add(this.btnAgregar);
			this.pnlOpciones.Controls.Add(this.btnEliminar);
			this.pnlOpciones.Controls.Add(this.btnCancelar);
			this.pnlOpciones.Dock = System.Windows.Forms.DockStyle.Bottom;
			this.pnlOpciones.Location = new System.Drawing.Point(0, 244);
			this.pnlOpciones.Name = "pnlOpciones";
			this.pnlOpciones.Padding = new System.Windows.Forms.Padding(10);
			this.pnlOpciones.Size = new System.Drawing.Size(535, 54);
			this.pnlOpciones.TabIndex = 1;
			// 
			// btnAgregar
			// 
			this.btnAgregar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(202)))), ((int)(((byte)(41)))), ((int)(((byte)(41)))));
			this.btnAgregar.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnAgregar.BorderRadius = 100F;
			this.btnAgregar.BorderSize = 0F;
			this.btnAgregar.DialogResult = System.Windows.Forms.DialogResult.OK;
			this.btnAgregar.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnAgregar.FlatAppearance.BorderSize = 0;
			this.btnAgregar.FlatAppearance.MouseOverBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(222)))), ((int)(((byte)(61)))), ((int)(((byte)(41)))));
			this.btnAgregar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnAgregar.Font = new System.Drawing.Font("Segoe UI Semibold", 12F);
			this.btnAgregar.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(246)))), ((int)(((byte)(246)))), ((int)(((byte)(246)))));
			this.btnAgregar.Location = new System.Drawing.Point(141, 10);
			this.btnAgregar.Name = "btnAgregar";
			this.btnAgregar.PercentualRadius = true;
			this.btnAgregar.Size = new System.Drawing.Size(128, 34);
			this.btnAgregar.TabIndex = 0;
			this.btnAgregar.Text = "Aceptar";
			this.btnAgregar.UseVisualStyleBackColor = false;
			// 
			// btnEliminar
			// 
			this.btnEliminar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(30)))), ((int)(((byte)(43)))), ((int)(((byte)(57)))));
			this.btnEliminar.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnEliminar.BorderRadius = 100F;
			this.btnEliminar.BorderSize = 0F;
			this.btnEliminar.DialogResult = System.Windows.Forms.DialogResult.Abort;
			this.btnEliminar.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnEliminar.FlatAppearance.BorderSize = 0;
			this.btnEliminar.FlatAppearance.MouseOverBackColor = System.Drawing.Color.FromArgb(((int)(((byte)(222)))), ((int)(((byte)(61)))), ((int)(((byte)(41)))));
			this.btnEliminar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnEliminar.Font = new System.Drawing.Font("Segoe UI Semibold", 12F);
			this.btnEliminar.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.btnEliminar.Location = new System.Drawing.Point(269, 10);
			this.btnEliminar.Name = "btnEliminar";
			this.btnEliminar.PercentualRadius = true;
			this.btnEliminar.Size = new System.Drawing.Size(128, 34);
			this.btnEliminar.TabIndex = 1;
			this.btnEliminar.Text = "Eliminar";
			this.btnEliminar.UseVisualStyleBackColor = false;
			this.btnEliminar.Visible = false;
			// 
			// btnCancelar
			// 
			this.btnCancelar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(30)))), ((int)(((byte)(43)))), ((int)(((byte)(57)))));
			this.btnCancelar.BorderColor = System.Drawing.Color.FromArgb(((int)(((byte)(48)))), ((int)(((byte)(48)))), ((int)(((byte)(48)))));
			this.btnCancelar.BorderRadius = 100F;
			this.btnCancelar.BorderSize = 0F;
			this.btnCancelar.DialogResult = System.Windows.Forms.DialogResult.Cancel;
			this.btnCancelar.Dock = System.Windows.Forms.DockStyle.Right;
			this.btnCancelar.FlatAppearance.BorderSize = 0;
			this.btnCancelar.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
			this.btnCancelar.Font = new System.Drawing.Font("Segoe UI Semibold", 11F);
			this.btnCancelar.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(236)))), ((int)(((byte)(236)))), ((int)(((byte)(236)))));
			this.btnCancelar.Location = new System.Drawing.Point(397, 10);
			this.btnCancelar.Name = "btnCancelar";
			this.btnCancelar.PercentualRadius = true;
			this.btnCancelar.Size = new System.Drawing.Size(128, 34);
			this.btnCancelar.TabIndex = 2;
			this.btnCancelar.Text = "Cancelar";
			this.btnCancelar.UseVisualStyleBackColor = false;
			// 
			// FParam
			// 
			this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
			this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
			this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(12)))), ((int)(((byte)(12)))), ((int)(((byte)(12)))));
			this.ClientSize = new System.Drawing.Size(535, 298);
			this.Controls.Add(this.pnlContenido);
			this.Controls.Add(this.pnlTítulo);
			this.Controls.Add(this.pnlOpciones);
			this.Font = new System.Drawing.Font("Segoe UI", 8.25F);
			this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
			this.MinimumSize = new System.Drawing.Size(400, 296);
			this.Name = "FParam";
			this.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
			this.Text = "FParam";
			this.pnlTítulo.ResumeLayout(false);
			this.pnlTítulo.PerformLayout();
			this.pnlContenido.ResumeLayout(false);
			this.pnlDesc.ResumeLayout(false);
			this.pnlDesc.PerformLayout();
			this.pnlTipo.ResumeLayout(false);
			this.pnlTipo.PerformLayout();
			this.pnlNombre.ResumeLayout(false);
			this.pnlNombre.PerformLayout();
			this.pnlOpciones.ResumeLayout(false);
			this.ResumeLayout(false);
			this.PerformLayout();

		}

		#endregion
		private System.Windows.Forms.Panel pnlTítulo;
		private System.Windows.Forms.Label lblTítulo;
		private System.Windows.Forms.Panel pnlContenido;
		private System.Windows.Forms.Panel pnlNombre;
		private System.Windows.Forms.Label lblNombre;
		private System.Windows.Forms.Panel pnlTipo;
		private System.Windows.Forms.Label lblTipo;
		private System.Windows.Forms.Panel pnlDesc;
		private System.Windows.Forms.Label lblDescripción;
		private System.Windows.Forms.Panel pnlOpciones;
		private ControLib.SleekButton btnCancelar;
		private ControLib.SleekButton btnAgregar;
		public ControLib.SleekTextBox tbNombre;
		public System.Windows.Forms.ComboBox cmbTipos;
		public ControLib.SleekTextBox tbDesc;
		private ControLib.SleekButton btnEliminar;
	}
}